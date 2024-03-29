import { Grid, Typography, Card, CardContent, Paper } from "@mui/material";
import React, { useContext } from "react";
import Sidebar from "../Dashboard/Sidebar";
import { storage } from "../Firebase_/Conf";
import { Link, useNavigate } from "react-router-dom";
import useStyles from "../Dashboard/StudentDashboard/StudentDashboardStyle";
import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Box,
  Autocomplete,
  InputLabel,
  Select,
  MenuItem,
  Input,
  Stack,
  InputAdornment,
  IconButton,
  FormHelperText,
  FormLabel,
  RadioGroup,
  Radio,
  FormGroup,
  FormControl,
} from "@mui/material";
import AttachmentIcon from "@mui/icons-material/AttachFile";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
// import Person from "@material-ui/icons/Person";
import { Person } from "@mui/icons-material";
import Divider from "@material-ui/core/Divider";

import LibraryAddTwoToneIcon from "@mui/icons-material/LibraryAddTwoTone";

import { AuthContext } from "../../Components/Context/AuthContext";
import { useHttpClient } from "../../Components/Context/http-hook";

const CreateCourseMat = (props) => {
  //   const [courseId, setCourseId] = useState("");
  const { courseID, courseTitle } = props;

  const navigate = useNavigate();
  const [option, setOption] = useState("");
  const classes = useStyles();
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [file, setFile] = useState(null);
  const [fileUrl, setUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [disabled, setDisabled] = useState(true);

  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [activityInstruction, setActivityInstruction] = useState("");
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [cutOffDate, setCutOffDate] = useState("");

  const handleChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  useEffect(() => {
    // console.log("file: ",file);
    if (file) {
      const fileName = file.name;
      const uploadTask = storage
        .ref(`whiteboard/submissions/${fileName}`)
        .put(file);

      // const uploadTask = storage.ref(`whiteboardfiles/${file.name}`).put(file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progres = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(progres);
        },

        (error) => {
          console.log(error);
        },
        () => {
          storage
            .ref(`whiteboard/submissions`)
            .child(fileName)
            .getDownloadURL()
            .then((url) => {
              // alert("url is ", url);
              setUrl(url);
            });
        }
      );
    }
  }, [file]);

  const uploadAssignment = async (event) => {
    event.preventDefault();
    try {
      let url;
      url = "http://localhost:5000/api/teachers/upload-material/" + courseID;
      await sendRequest(
        url,
        "POST",
        JSON.stringify({
          url: fileUrl,
          title: assignmentName,
        }),
        {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json",
        }
      );

      alert("Material uploaded");
      navigate(
        "/teacher/my/course/" + courseTitle + "/" + courseID + "/materials",
        {
          state: {
            courseID: courseID,
            courseTitle: courseTitle,
          },
        }
      );
    } catch (error) {}
  };

  return (
    <>
      <div className={classes.root}>
        <Sidebar setOption={setOption} />
        <main className={classes.content}>
          <List dense>
            <ListItem>
              <Grid item>
                {/* make it to center */}
                {/* assh color : #f5f5f5 */}
                {/* <Paper
                  className="paper"
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    bgcolor: "#f5f5f5",
                    alignContent: "center",
                  }}
                > */}
                <Typography
                  sx={{
                    paddingLeft: "20px",
                    paddingRight: "20px",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    color: "black",
                    font: "caption",
                    variant: "h3",
                  }}
                >
                  Upload Material
                </Typography>
                {/* </Paper> */}
              </Grid>
            </ListItem>
            <ListItem>
              <Grid item>
                <TextField
                  id="outlined-basic"
                  label="Material Title"
                  variant="outlined"
                  //   value={assTitle}
                  sx={{ minWidth: 600, bgcolor: "#f5f5f5" }}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  // style={{ bgcolor: "#f5f5f5" }}
                  size="big"
                />
              </Grid>
            </ListItem>
            <ListItem>
              <Grid item>
                <Stack>
                  <Button
                    variant="outlined"
                    component="label"
                    color="primary"
                    style={{
                      margin: "auto",
                      marginTop: "20px",
                      marginBottom: "20px",
                      width: "200px",
                      height: "50px",
                      borderRadius: "100px",
                    }}
                    endIcon={<AttachmentIcon />}
                  >
                    Attach File
                    <input
                      hidden
                      multiple
                      type="file"
                      onChangeCapture={handleChange}
                    />
                  </Button>

                  <Grid item container>
                    <Grid item sm={3}></Grid>
                    <Grid item>
                      <Typography variant="h5">
                        <progress value={progress} max="100" /> {progress}%
                      </Typography>
                      <Typography variant="h5">
                        File: {file ? file.name : "No file selected"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
                {/* make a fancy file input button and take the file */}
                {/* <input
                  type="file"
                  onChange={(e) => setAssignmentFile(e.target.files[0])}
                />
                <Button variant="contained" color="primary">
                  Attach
                </Button> */}
              </Grid>
            </ListItem>
            {/* <ListItem>
              <Grid item>
                <TextField
                  id="outlined-basic"
                  label="Description"
                  variant="outlined"
                  multiline
                  maxRows={10}
                  sx={{ minWidth: 600, bgcolor: "#f5f5f5" }}
                  // value={desc}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                />
              </Grid>
            </ListItem> */}
            {/* <ListItem>
              <Grid item>
                <TextField
                  id="outlined-basic"
                  label="Activity Instruction"
                  variant="outlined"
                  multiline
                  maxRows={10}
                  sx={{ minWidth: 600, bgcolor: "#f5f5f5" }}
                  // value={desc}
                  onChange={(e) => setActivityInstruction(e.target.value)}
                />
              </Grid>
            </ListItem> */}
            <ListItem>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginTop: "20px", marginBottom: "20px" }}
                  onClick={uploadAssignment}
                >
                  Upload Material
                </Button>
              </Grid>
            </ListItem>
          </List>
        </main>
      </div>
      {/* <div>
        <Grid container direction="column" spacing={2}>
          <Grid item container>
            <Grid item sm={3} />

            <Grid item sm={3} />
          </Grid>
          <Grid item container>
            <Grid item sm={5} />

            <Grid item sm={5} />
          </Grid>
        </Grid>
      </div> */}
    </>
  );
};

export default CreateCourseMat;
