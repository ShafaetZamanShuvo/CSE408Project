const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator"); //this one is to validate the inputs
const mongoose = require("mongoose");
const Course = require("../models/courses");
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/check-auth");
const express = require("express");
const router = express.Router();
const PrivateFile = require("../models/private_files");
const Forum = require("../models/course-forum");
const ForumPost = require("../models/forum-post");
const PostReply = require("../models/post-reply");
const { ConnectionCheckOutStartedEvent } = require("mongodb");
const Notification = require("../models/notifications");

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError("Could not find a user for this id.", 404);
  }
  res.json({ user: user });
};

const login = async (req, res, next) => {
  const { moodleID, password } = req.body;
  console.log(req.body);
  let existingUser;
  try {
    existingUser = await User.findOne({ moodleID: moodleID });
  } catch (err) {
    console.log(err);
    return next(new HttpError("Something went wrong, could not login.", 500));
  }
  if (!existingUser) {
    return next(new HttpError("Could not login, wrong credentials.", 401));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Something went wrong, could not login.", 500));
  }

  if (!isValidPassword) {
    return next(new HttpError("Could not login, wrong credentials.", 401));
  }

  let token;
  try {
    if (existingUser.role === "student") {
      token = jwt.sign(
        { userId: existingUser.id, moodleID: existingUser.moodleID },
        "supersecret_dont_share_student",
        { expiresIn: "1h" }
      );
    }
    if (existingUser.role === "teacher") {
      token = jwt.sign(
        { userId: existingUser.id, moodleID: existingUser.moodleID },
        "supersecret_dont_share_teacher",
        { expiresIn: "1h" }
      );
    }
  } catch (err) {
    console.log(err);
    return next(new HttpError("Something went wrong, could not login.", 500));
  }

  res.json({
    success: true,
    userId: existingUser.id,
    moodleID: existingUser.moodleID,
    userRole: existingUser.role,
    token: token,
    username: existingUser.name,
  });
};

const getCoursesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  const user = await User.findById(userId);
  if (!user) {
    console.log(err);
    return next(new HttpError("Could not find a user for this id.", 404));
  }

  let coursesOfUser;
  try {
    coursesOfUser = await User.findById(userId).populate("courses");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not get courses.", 500)
    );
  }
  if (!coursesOfUser || coursesOfUser.length === 0) {
    return next(new HttpError("Could not get courses, no courses found.", 404));
  }

  let courses = [];
  for (let i = 0; i < coursesOfUser.courses.length; i++) {
    courses.push(coursesOfUser.courses[i]);
  }

  //sort the courses by courseTitle
  courses.sort((a, b) => {
    if (a.courseTitle < b.courseTitle) return -1;
    if (a.courseTitle > b.courseTitle) return 1;
    return 0;
  }),
    (err) => {
      console.log(err);
      return next(new HttpError("Something went wrong, could not get courses.", 500));
    };

  res.json({ courses: courses });

  // res.json({
  //   courses: coursesOfUser.courses.map((course) =>
  //     course.toObject({ getters: true })
  //   ),
  // });
};

const uploadPrivateFiles = async (req, res, next) => {
  const userID = req.params.uid;
  const user = await User.findById(userID);

  if (!user) {
    console.log(err);
    return next(
      new HttpError("Something went wrong could not get the specific user", 500)
    );
  }

  const createdPrivateFile = new PrivateFile({
    user: user,
    file: req.body.url,
    fileName: req.body.filename,
  });

  try {
    await createdPrivateFile.save();
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPrivateFile.save({ session: session });
    await user.privateFiles.push(createdPrivateFile);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not upload file.", 500)
    );
  }

  res.status(201).json({
    message: "File uploaded successfully!",
    createdPrivateFile: createdPrivateFile,
    user: user,
  });
};

const getAllPrivateFilesByUSerID = async (req, res, next) => {
  const userID = req.params.uid;
  const user = await User.findById(userID);

  if (!user) {
    console.log(err);
    return next(
      new HttpError("Something went wrong could not get the specific user", 500)
    );
  }

  let privateFiles;
  try {
    privateFiles = await PrivateFile.find({ user: userID });
  } catch (err) {
    console.log(err);
    return next(
      new HttpError(
        "Something went wrong, could not get the private files.",
        500
      )
    );
  }
  if (!privateFiles || privateFiles.length === 0) {
    return next(
      new HttpError(
        "Could not get the private files, no private files found.",
        404
      )
    );
  }
  res.json({
    privateFiles: privateFiles.map((privateFile) =>
      privateFile.toObject({ getters: true })
    ),
  });
};

const getPrivateFileByID = async (req, res, next) => {
  const privateFileID = req.params.privateFileID;
  const privateFile = await PrivateFile.findById(privateFileID);
  if (!privateFile) {
    console.log(err);
    return next(
      new HttpError("Could not find a private file for this id.", 404)
    );
  }
  res.json({ privateFile: privateFile });
};

const deletePrivateFileByID = async (req, res, next) => {
  const privateFileID = req.params.privateFileID;
  const privateFile = await PrivateFile.findById(privateFileID).populate(
    "user"
  );

  if (!privateFile) {
    console.log(err);
    return next(
      new HttpError("Could not find a private file for this id.", 404)
    );
  }

  let user;
  try {
    user = await User.findById(privateFile.user);
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not get the user.", 500)
    );
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await privateFile.remove({ session: sess });
    await user.privateFiles.pull(privateFile);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not delete the file.", 500)
    );
  }

  res.status(200).json({
    message: "File deleted successfully!",
  });
};

const updateProfile = async (req, res, next) => {
  const userID = req.params.uid;
  const user = await User.findById(userID);
  if (!user) {
    console.log(err);
    return next(
      new HttpError("Something went wrong could not get the specific user", 500)
    );
  }

  user.name = req.body.name;
  if (req.body.url !== "") {
    user.image = req.body.url;
  }
  user.phone = req.body.phone;
  user.address = req.body.address;
  user.bio = req.body.bio;

  try {
    await user.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Something went wrong, could not update the user.", 500)
    );
  }

  res.status(200).json({
    message: "User Info updated successfully!",
    user: user,
  });
};

const changePassword = async (req, res, next) => {
  const userID = req.userData.userId;
  const user = await User.findById(userID);
  if (!user) {
    console.log(err);
    return next(
      new HttpError("Something went wrong could not get the specific user", 500)
    );
  }

  const isValidOldPassword = await bcrypt.compare(
    req.body.oldPassword,
    user.password
  );

  if (!isValidOldPassword) {
    return next(new HttpError("Old password is incorrect.", 403));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  user.password = hashedPassword;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError("Chaning password, please try again.", 500);
    console.log(err);
    return next(error);
  }

  res.status(200).json({
    message: "Password changed successfully!",
    user: user,
  });
};

const userPostinForum = async (req, res, next) => {
  const courseID = req.params.courseID;
  const userID = req.params.uid;
  const user = await User.findById(userID);

  let course;

  try {
    course = await Course.findById(courseID);
  } catch (err) {
    const error = new HttpError("Couldn't find the course", 500);
    console.log(err);
    return next(error);
  }

  let forum = await Forum.findById(course.forum);

  if (!forum) {
    return next(
      new HttpError("Could not find the forum for this course.", 404)
    );
  }
  let post;
  if ((await user.role) === "teacher") {
     post = new ForumPost({
      user: user,
      forum: forum,
      title: req.body.title,
      postDescription: req.body.postDescription,
      postDate: new Date(),
      author: user.name,
    });
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await post.save({ session: session });
    await forum.posts.push(post);
    await forum.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not create the post, please try again.", 500)
    );
  }

  res.status(200).json({
    message: "Post created successfully!",
    post: post,
  });
};

const getForumPosts = async (req, res, next) => {
  const courseID = req.params.courseID;

  const forum = await Forum.findOne({ course: courseID });
  if (!forum) {
    console.log(err);
    return next(
      new HttpError("Could not find the forum for this course.", 404)
    );
  }

  let posts;
  try {
    posts = await ForumPost.find({ forum: forum._id.toString() }).populate("user").sort({postDate: -1});
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the posts for this forum.", 500));
  }

  res.status(200).json({
    message: "Posts fetched successfully!",
    posts: posts,
  });
};

const getForumPost = async (req, res, next) => {
  const postID = req.params.postID;

  let post;
  try {
    post = await ForumPost.findById(postID).populate("user");
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the post for this forum.", 500));
  }

  res.status(200).json({
    message: "Post fetched successfully!",
    post: post,
  });
};

const replyToForumPost = async (req, res, next) => {
  const postID = req.params.postID;
  const userID = req.params.uid;
  const user = await User.findById(userID);

  let post;
  try {
    post = await ForumPost.findById(postID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the post for this forum.", 500));
  }

  const reply = new PostReply({
    replyDescription: req.body.replyDescription,
    replyDate: new Date(),
    user: user,
    post: post,
    replier: user.name,
  });

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await reply.save({ session: session });
    await post.replies.push(reply);
    await post.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not create the reply, please try again.", 500)
    );
  }

  res.status(200).json({
    message: "Reply created successfully!",
    reply: reply,
  });
};

const getRepliesOfForumPost = async (req, res, next) => {
  const postID = req.params.postID;

  let post;
  try {
    post = await ForumPost.findById(postID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the post for this forum.", 500));
  }

  let replies;
  try {
    replies = await PostReply.find({ post: post._id }).populate("user");
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the replies for this post.", 500));
  }

  res.status(200).json({
    message: "Replies fetched successfully!",
    replies: replies,
    post: post,
  });
};

const deleteForumPost = async (req, res, next) => {
  const postID = req.params.postID;

  let post;
  try {
    post = await ForumPost.findById(postID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the post for this forum.", 500));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await post.remove({ session: session });
   //delete the replies of that post
    await PostReply.deleteMany({ post: post._id }, { session: session });
    const forumRelatedtoPost = await Forum.findById(post.forum);
    await forumRelatedtoPost.posts.pull(post);
    await forumRelatedtoPost.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not delete the post, please try again.", 500)
    );
  }

  res.status(200).json({
    message: "Post deleted successfully!",
  });
};

const deleteReplyOfForumPost = async (req, res, next) => {
  const replyID = req.params.replyID;

  let reply;
  try {
    reply = await PostReply.findById(replyID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the reply for this post.", 500));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await reply.remove({ session: session });
    const postRelatedtoReply = await ForumPost.findById(reply.post);
    await postRelatedtoReply.replies.pull(reply);
    await postRelatedtoReply.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not delete the reply, please try again.", 500)
    );
  }

  res.status(200).json({
    message: "Reply deleted successfully!",
  });
};

const editPost = async (req, res, next) => {
  const postID = req.params.postID;

  let post;
  try {
    post = await ForumPost.findById(postID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the post for this forum.", 500));
  }
  post.postDescription = req.body.postDescription;
  post.postDate = new Date();

  try {
    await post.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not edit the post, please try again.", 500)
    );
  }

  res.status(200).json({
    message: "Post edited successfully!",
    post: post,
  });
};

const editReply = async (req, res, next) => {
  const replyID = req.params.replyID;

  let reply;
  try {
    reply = await PostReply.findById(replyID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the reply for this post.", 500));
  }

  reply.replyDescription = req.body.replyDescription;
  reply.replyDate = new Date();

  try {
    await reply.save();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not edit the reply, please try again.", 500)
    );
  }

  res.status(200).json({
    message: "Reply edited successfully!",
    reply: reply,
  });
};

const getForumByCourseID = async (req, res, next) => {
  const courseID = req.params.courseID;

  let course;
  try {
    course = await Course.findById(courseID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the course for this forum.", 500));
  }

  let forums;
  try {
    forums = await Forum.find({ course: course._id });
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not get the forums for this course.", 500)
    );
  }

  res.status(200).json({
    message: "Forums fetched successfully!",
    forums: forums,
  });
};

const getAllNotifications = async (req, res, next) => {
  let notifications_array = [];
  let finalNotifications = [];
  let user = await User.findById(req.params.uid);
  try {
    //find the notofications of the user in the database and sort them by date
    // notifications = await Notification.find({ user: req.params.uid }).sort({
    //   date: -1,
    // });

    //find the notofications of the user in the database and sort them by date
    let notifications = await user.notifications;
    for (let i = 0; i < notifications.length; i++) {
      let notification = await Notification.findById(
        notifications[i].toString()
      );
      notifications_array.push(notification);
    }

    //now just sort the notifications by date
    notifications_array.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the notifications.", 500));
  }

  res.status(200).json({
    message: "Notifications fetched successfully!",
    notifications: notifications_array,
  });
};

const deleteNotification = async (req, res, next) => {
  //get the notification id from the params first
  const notificationID = req.params.notificationID;
  let notification;
  try {
    notification = await Notification.findById(notificationID).populate("user");
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the notification.", 500));
  }
  //delete the notification from the database
  let relatedCourse = await Course.findById(notification.course);
  try {
    const sessionId = await mongoose.startSession();
    sessionId.startTransaction();
    await notification.remove({ session: sessionId });
    //for all particapnts of the course remove the notification from their notifications array
    for (participant in relatedCourse.participants) {
      let user = await User.findById(participant);
      await user.notifications.pull(notification);
      await user.save({ session: sessionId });
    }
    await sessionId.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not delete the notification.", 500));
  }

  res.status(200).json({
    message: "Notification deleted successfully!",
  });
};

const getReplyByReplyID = async (req, res, next) => {
  const replyID = req.params.replyID;

  let reply;
  try {
    reply = await PostReply.findById(replyID);
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not get the reply for this post.", 500));
  }

  res.status(200).json({
    message: "Reply fetched successfully!",
    reply: reply,
  });
}

exports.getUserById = getUserById;
exports.login = login;
exports.getCoursesByUserId = getCoursesByUserId;
exports.uploadPrivateFiles = uploadPrivateFiles;
exports.getPrivateFileByID = getPrivateFileByID;
exports.deletePrivateFileByID = deletePrivateFileByID;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.userPostinForum = userPostinForum;
exports.getForumPosts = getForumPosts;
exports.getForumPost = getForumPost;
exports.replyToForumPost = replyToForumPost;
exports.getRepliesOfForumPost = getRepliesOfForumPost;
exports.deleteForumPost = deleteForumPost;
exports.deleteReplyOfForumPost = deleteReplyOfForumPost;
exports.editPost = editPost;
exports.editReply = editReply;
exports.getForumByCourseID = getForumByCourseID;
exports.getAllNotifications = getAllNotifications;
exports.deleteNotification = deleteNotification;
exports.getAllPrivateFilesByUserID = getAllPrivateFilesByUSerID;
exports.getReplyByReplyID = getReplyByReplyID;