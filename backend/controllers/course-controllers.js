const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator"); //this one is to validate the inputs
const mongoose = require("mongoose");
const Course = require("../models/courses");
const User = require("../models/users");
const Session = require("../models/sessions");
const fs = require("fs");
const path = require("path");
const CourseMaterials = require("../models/course_materials");
const Assignment = require("../models/assignment");
const checkAuth = require("../middleware/check-auth");
const express = require("express");
const router = express.Router();

const getCoursesList = async (req, res, next) => {
  let courses;
  try {
    courses = await Course.find();
  } catch (err) {
    const error = new HttpError(
      "Failed to fetch courses, please try again.",
      500
    );
    return next(error);
  }
  if (!courses) {
    const error = new HttpError("Could not find courses.", 404);
    return next(error);
  }
  res.json({
    courses: courses.map((course) => course.toObject({ getters: true })),
  });
};

const getCourseById = (req, res, next) => {
  const courseId = req.params.courseID;
  Course.findById(courseId)
    .then((course) => {
      if (!course) {
        throw new HttpError("Could not find a course for this id.", 404);
      }
      res.json({ course: course.toObject({ getters: true }) });
    })
    .catch((err) => {
      console.log(err);
      next(
        new HttpError(
          "Something went wrong, could not find a course for this id.",
          500
        )
      );
    });
};

const getUsersByCourseId = async (req, res, next) => {
  const courseId = req.params.courseID;
  const course = await Course.findById(courseId);
  if (!course) {
    console.log(err);
    return next(new HttpError("Could not find a course for this id.", 404));
  }
  let usersOfCourse;
  try {
    usersOfCourse = await Course.findById(courseId).populate("participants");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not get users.", 500)
    );
  }
  if (!usersOfCourse || usersOfCourse.length === 0) {
    return next(new HttpError("Could not get users, no users found.", 404));
  }
  res.json({
    users: usersOfCourse.participants.map((user) =>
      user.toObject({ getters: true })
    ),
  });
};

const getStudentsByCourseId = async (req, res, next) => {
  const courseId = req.params.courseID;
  const course = await Course.findById(courseId);
  if (!course) {
    console.log(err);
    return next(new HttpError("Could not find a course for this id.", 404));
  }

  let studentsOfCourse;
  try {
    studentsOfCourse = await Course.findById(courseId).populate("participants");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not get students.", 500)
    );
  }
  if (!studentsOfCourse || studentsOfCourse.length === 0) {
    return next(
      new HttpError("Could not get students, no students found.", 404)
    );
  }
  let students = [];
  for (let i = 0; i < studentsOfCourse.participants.length; i++) {
    if (studentsOfCourse.participants[i].role === "student") {
      students.push(studentsOfCourse.participants[i]);
    }
  }

  //sort the students by moodleID
  students.sort((a, b) => {
    return a.moodleID - b.moodleID;
  });

  res.json({
    students: students.map((student) => student.toObject({ getters: true })),
  });
};

const getTeachersByCourseId = async (req, res, next) => {
  const courseId = req.params.courseID;
  const course = await Course.findById(courseId);
  if (!course) {
    console.log(err);
    return next(new HttpError("Could not find a course for this id.", 404));
  }

  let teachersOfCourse;
  try {
    teachersOfCourse = await Course.findById(courseId).populate("participants");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not get teachers.", 500)
    );
  }
  if (!teachersOfCourse || teachersOfCourse.length === 0) {
    return next(new HttpError("Could not get teachers, no teachers found.", 404));
  }
  let teachers = [];
  for (let i = 0; i < teachersOfCourse.participants.length; i++) {
    if (teachersOfCourse.participants[i].role === "teacher") {
      teachers.push(teachersOfCourse.participants[i]);
    }
  }

  //sort the teachers by moodleID
  teachers.sort((a, b) => {
    return a.moodleID - b.moodleID;
  });

  res.json({
    teachers: teachers.map((teacher) => teacher.toObject({ getters: true })),
  });
};



const getCourseBySessionID = async (req, res, next) => {
  const sessionID = req.params.sessionID;
  const session = await Session.findById(sessionID);
  if (!session) {
    console.log(err);
    return next(new HttpError("Could not find a session for this id.", 404));
  }
  let courseOfSession;
  try {
    courseOfSession = await Session.findById(sessionID).populate("courses");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not get course.", 500)
    );
  }
  if (!courseOfSession || courseOfSession.length === 0) {
    return next(new HttpError("Could not get course, no course found.", 404));
  }
  res.json({ courses: courseOfSession.courses.toObject({ getters: true }) });
};

const getSessionNameBySessionId = async (req, res, next) => {
  const sessionID = req.params.sessionID;
  const session = await Session.findById(sessionID);
  if (!session) {
    console.log(err);
    return next(new HttpError("Could not find a session for this id.", 404));
  }
  const sessionName = session.sessionID;
  res.json({ sessionName });
};

const uploadCourseMaterials = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  if (req.files === null) {
    return next(new HttpError("No file was uploaded", 422));
  }

  console.log(req.body);

  const courseId = req.params.courseID;

  const createdCourseMaterials = new CourseMaterials({
    file: req.file.path,
    course: courseId,
  });

  const relatedCourse = await Course.findById(courseId);
  if (!relatedCourse) {
    return next(new HttpError("Could not find a course for this id.", 404));
  }

  try {
    await createdCourseMaterials.save();
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdCourseMaterials.save({ session: sess });
    await relatedCourse.courseMaterials.push(createdCourseMaterials);
    await relatedCourse.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError(
        "Something went wrong, could not upload course materials.",
        500
      )
    );
  }

  res.json({ message: "Course materials uploaded successfully." });
};

const fetchCourseStuffs = async (req, res, next) => {
  const courseId = req.params.courseID;
  const course = await Course.findById(courseId);
  if (!course) {
    console.log(err);
    return next(new HttpError("Could not find a course for this id.", 404));
  }
  let courseStuffs = [];
  let materials = [];
  let assignments = [];

  for (let i = 0; i < course.courseMaterials.length; i++) {
    materials.push(
      await CourseMaterials.findById(course.courseMaterials[i].toString())
    );
  }

  for (let i = 0; i < course.courseAssignments.length; i++) {
    assignments.push(
      await Assignment.findById(course.courseAssignments[i].toString())
    );
  }

  //sort the materials by date
  materials
    .sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .reverse();
  assignments
    .sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .reverse();

  courseStuffs.push(materials);
  courseStuffs.push(assignments);

  res.json({ courseStuffs });
};

exports.getCourseById = getCourseById;
exports.getCoursesList = getCoursesList;
exports.getUsersByCourseId = getUsersByCourseId;
exports.getCourseBySessionID = getCourseBySessionID;
exports.getSessionNameBySessionId = getSessionNameBySessionId;

exports.uploadCourseMaterials = uploadCourseMaterials;
exports.fetchCourseStuffs = fetchCourseStuffs;

exports.getStudentsByCourseId = getStudentsByCourseId;
exports.getTeachersByCourseId = getTeachersByCourseId;
