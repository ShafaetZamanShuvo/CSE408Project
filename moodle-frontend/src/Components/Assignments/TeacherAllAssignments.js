import { React, useState, useEffect, useContext } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { CardActionArea, Grid } from "@mui/material";
import { AuthContext } from "../../Components/Context/AuthContext";
import { useHttpClient } from "../../Components/Context/http-hook";
import { format } from "date-fns";
import { TextField } from "@mui/material";
import { Assessment } from "@mui/icons-material";
import AssignmentCard from "./AssignmentCard";
import CompletedAssignmentCard from "./CompletedAssignmentCard";
import AllSubmissions from "../Submission/AllSubmissions";
import { Link, useNavigate } from "react-router-dom";

const bull = (
  <Box
    component="span"
    sx={{ display: "inline-block", mx: "2px", transform: "scale(0.8)" }}
  >
    •
  </Box>
);

const TeacherAllAssignments = (props) => {
  // destructuring the props
  const { courseTitle, courseID, studentId } = props;
  // alert(courseTitle);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedCourseAssignments, setLoadedCourseAssignments] = useState();
  const [submissionFile, setSubmissionFile] = useState();
  const [selectedAssId, setSelectedAssId] = useState();
  const [component, setComponent] = useState(<div></div>);
  const getToken = localStorage.getItem("token");

  let url2 =
    "http://localhost:5000/api/teachers/get-all-course-assignment/" + courseID;

  useEffect(() => {
    const fetchCourseAssignments = async () => {
      try {
        const responseData = await sendRequest(url2, "GET", null, {
          Authorization: "Bearer " + getToken,
        });
        setLoadedCourseAssignments(responseData.courseAssignments);
        setComponent(
          <Grid container spacing={1}>
            {
              //!loadedCourseAssignments &&
              responseData.courseAssignments.map((assignment) => (
                <Grid item xs={12}>
                  <CardActionArea
                    onClick={(e) => {
                      setSelectedAssId(assignment._id);
                    }}
                  >
                    <Card
                      style={{
                        minWidth: 275,
                        height: "80%",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      {/* <Card sx={{ minWidth: 275 }}> */}
                      <CardContent>
                        <Typography
                          variant="h5"
                          sx={{ fontSize: 21 }}
                          color="text.secondary"
                          gutterBottom
                        >
                          Assignment Title : {assignment.title}
                        </Typography>

                        {/* <Typography sx={{ mb: 1.5 }} color="text.secondary">
                          {assignment.title}
                        </Typography> */}
                        {/* make it bold */}
                        <Typography
                          variant="h5"
                          sx={{ mb: 1.5, font: "caption" }}
                          color="text.secondary"
                        >
                          Deadline : {formatDate(assignment.dueDate)}
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ mb: 1.5, font: "caption" }}
                          color="text.secondary"
                        >
                          Cutoff Time : {formatDate(assignment.cutOffDate)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </CardActionArea>
                </Grid>
              ))
            }
          </Grid>
        );
      } catch (err) {}
    };
    fetchCourseAssignments();
    // });
  }, [sendRequest, url2, getToken]);

  useEffect(() => {
    // if (selectedAssId) {
    //   navigate(
    //     "/teacher/my/course/" +
    //       courseTitle +
    //       "/" +
    //       courseID +
    //       "/edit/assignments/" +
    //       selectedAssId
    //   );
    // }
    setComponent(
      <AllSubmissions
        courseID={courseID}
        courseTitle={courseTitle}
        assignmentId={selectedAssId}
      />
    );
  }, [selectedAssId]);

  const formatDate = (date) => {
    // format to i.e 6 jan, saturday at 3:00pm
    var d = new Date(date);
    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    var n = weekday[d.getDay()];
    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";

    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    var mon = month[d.getMonth()];
    var day = d.getDate();
    var year = d.getFullYear();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;
    var strTime =
      n +
      ", " +
      mon +
      " " +
      day +
      ", " +
      year +
      " at " +
      h +
      ":" +
      m +
      ":" +
      s +
      " " +
      ampm;
    // var date = n + ", " + mon + +day + ", " + year + " at " + h + ":" + m;
    return strTime;
  };

  return (
    <>
      <div>{component}</div>
      {/* {loadedCourseAssignments &&
        loadedCourseAssignments.map((assignment) => {
          return (
            <div>{component}</div> */}
      {/* // <AssignmentCard */}
      {/* //   key={assignment._id}
            //   assignment={assignment}
            //   courseTitle={courseTitle}
            // /> */}
      {/* // ); */}
      {/* // })} */}
    </>
  );
};

export default TeacherAllAssignments;
