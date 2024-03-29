import {
  Grid,
  Typography,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  Divider,
  ListItemText,
} from "@mui/material";
import { AuthContext } from "../Context/AuthContext";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useHttpClient } from "../Context/http-hook";

import useStyles from "../Dashboard/StudentDashboard/StudentDashboardStyle";
import { useEffect } from "react";
import {
  Button,
  Autocomplete,
  Box,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  Input,
  InputAdornment,
  IconButton,
  FormHelperText,
  FormLabel,
  RadioGroup,
  Radio,
  FormGroup,
  FormControl,
} from "@mui/material";
import LibraryAddTwoToneIcon from "@mui/icons-material/LibraryAddTwoTone";
import { useForm } from "react-hook-form";
import Participants from "../Participants/Participants";

let coursesList = [];
let usersList = [];

const CourseParticipants = () => {
  const auth = useContext(AuthContext);
  const [courseId, setCourseId] = useState();

  const [teacherId, setTeacherId] = useState("");
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedCourseList, setLoadedCourseList] = useState();
  const [loadedParticipantList, setLoadedParticipantList] = useState();

  const [component, setComponent] = useState(<div></div>);
  const [component2, setComponent2] = useState(<div></div>);
  //_id, moodleID, name

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    // alert(studentId);
    // alert(courseId);
    if (!teacherId || !courseId) {
      alert("Invalid credentials");
    } else {
      // teacherId = teacherId.join("");
      let url = "http://localhost:5000/api/admin/edit/" + courseId;
      try {
        await sendRequest(
          url,
          "PATCH",
          JSON.stringify({
            participants: teacherId,
          }),
          {
            Authorization: "Bearer " + localStorage.getItem("token"),
            "Content-Type": "application/json",
          }
        );
        alert("Teacher assigned to course");
        window.location.reload();
      } catch (error) {}
      // alert("Teacher added to course");
    }
  };

  const navigate = useNavigate();
  const getToken = localStorage.getItem("token");

  let url = "http://localhost:5000/api/courses/";

  // let url2 = "http://localhost:5000/api/admin/get-student-list/";

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const responseData = await sendRequest(url, "GET", null, {
          Authorization: "Bearer " + getToken,
        });

        if (coursesList.length === 0) {
          // setCourseList(responseData.courses);
          responseData.courses.map((x) =>
            coursesList.push({
              id: x._id,
              courseID: x.courseID,
              sessionName: x.sessionName,
            })
          );
        }
        setLoadedCourseList(responseData.courses);
        setComponent(
          //   <ListItem>
          <Grid item>
            <Autocomplete
              id="place-select"
              sx={{ width: 300 }}
              //   style={{ textAlign: "center" }}
              //   alignItems="center"
              value={courseId}
              onChange={(event, newValue) => {
                // console.log(newValue.id);
                setCourseId(newValue.id);
              }}
              options={coursesList}
              autoHighlight
              getOptionLabel={(option) =>
                option.sessionName + " , " + option.courseID
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  {option.sessionName} , {option.courseID}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Choose a Course"
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password", // disable autocomplete and autofill
                  }}
                />
              )}
            />
          </Grid>
          //   </ListItem>
        );
      } catch (err) {}
    };
    fetchCourse();
  }, [sendRequest, url, getToken]);

  useEffect(() => {
    if (courseId) {
      //   let url2 = "http://localhost:5000/api/courses/" + courseId + "/users";
      //   const fetchUsers = async () => {
      //     try {
      //       const responseData = await sendRequest(url2, "GET", null, {
      //         Authorization: "Bearer " + getToken,
      //       });
      //   setLoadedParticipantList(responseData.users);
      setComponent2(<Participants courseID={courseId} />);
      //     } catch (err) {}
      //   };

      //   fetchUsers();
    }
  }, [sendRequest, getToken, courseId]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="top"
      minHeight="100vh"
    >
      <div>
        <Grid container direction="column" spacing={3}>
          <Grid item>
            <Paper
              className="paper"
              sx={{
                width: "100%",
                maxWidth: "100%",
                bgcolor: "#f5f5f5",
                alignContent: "center",
              }}
            >
              <Typography
                sx={{
                  paddingLeft: "20px",
                  paddingRight: "20px",
                  paddingTop: "20px",
                  paddingBottom: "20px",
                  color: "black",
                  font: "caption",
                  alignItems: "center",
                }}
              >
                {/* Course Participants */}
              </Typography>
            </Paper>
          </Grid>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid item container spacing={2}>
              <Grid item sm={3.5} />

              {component}
              {component2}
              {/* {!isLoading && loadedCourseList && (
              
            )} */}

              {/* {!isLoading && loadedTeachersList && (
              
            )} */}

              <Grid item sm={2} />
            </Grid>
            <Grid item container>
              <Grid item sm={3} />
              <Grid item></Grid>
              <Grid item sm={3} />
            </Grid>
          </form>
        </Grid>
      </div>
    </Box>
  );
};

export default CourseParticipants;
