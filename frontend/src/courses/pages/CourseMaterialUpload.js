import React, { useState, useContext } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useHttpClient } from "../../shared/hooks/http-hook";
import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import FileUpload from "../../shared/components/FormElements/FileUpload";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH,
} from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import "./CourseForm.css";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";

const CourseMaterialUpload = () => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const courseID = useParams().courseID;

  const [formState, inputHandler] = useForm(
    {
      file: {
        value: null,
        isValid: false,
      },
    },
    false
  );

  const history = useHistory();

  const courseMatrialUploadHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("file", formState.inputs.file.value);
    formData.append("course", courseID);
    formData.append("uploader", 123);
    try {
      await sendRequest(
        `http://localhost:5000/api/courses/upload-course-materials/${courseID}`,
        "POST",
        formData
        // JSON.stringify({
        //   participants: formState.inputs.moodleID.value,
        //   //   courseID: courseID,
        // }),
        // {
        //   "Content-Type": "application/json",
        // }
      );
      history.push("/");
    } catch (error) {}
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <form className="course-form" onSubmit={courseMatrialUploadHandler}>
        {isLoading && <LoadingSpinner asOverlay />}
        <FileUpload
          center
          id="file"
          onInput={inputHandler}
          errorText="Please provide a file"
        />
        {/* <Input
          id="file"
          element="input"
          type="text"
          label="Student Moodle ID"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid moodle id."
          onInput={inputHandler}
        /> */}
        <Button type="submit" disabled={!formState.isValid}>
          ADD COURSE MATERIAL
        </Button>
      </form>
    </React.Fragment>
  );
};

export default CourseMaterialUpload;
