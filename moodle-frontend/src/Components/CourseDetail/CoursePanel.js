import { Grid, Typography, Card, CardContent } from "@mui/material";
import { React, useState, useEffect } from "react";
import Card_ from "./CourseCard";

import CourseDetail from "./Course";

const CoursePanel = ({ courses }) => {
  const [option, setOption] = useState();
  const [courseID, setCourseID] = useState();
  const [courseTitle, setCourseTitle] = useState();

  const [component, setComponent] = useState(
    <div>
      <Grid container>
        {courses.map((course) => (
          <Grid item xs={12} sm={6} md={4}>
            <Card_
              key={course._id}
              course={course}
              setCourseID={setCourseID}
              setCourseTitle={setCourseTitle}
            />
          </Grid>
        ))}
      </Grid>
    </div>
  );
  // console.log("coursePanel: ", courses);

  useEffect(() => {
    if (courseTitle) {
      setComponent(
        <CourseDetail courseID={courseID} courseTitle={courseTitle} />
      );
    } else {
      setComponent(
        <div>
          <Grid container>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4}>
                <Card_
                  key={course._id}
                  course={course}
                  setCourseID={setCourseID}
                  setCourseTitle={setCourseTitle}
                />
              </Grid>
            ))}
          </Grid>
        </div>
      );
    }
  }, [courseTitle]);

  return <div>{component ? component : <div>Loading...</div>}</div>;
};

export default CoursePanel;

{
  /* <Grid container>
                        {courses.map(course => (
                            <Grid item xs={12} sm={6} md={4}>
                                <Card_ course={course} />
                            </Grid>
                        ))}
                    </Grid> */
}
