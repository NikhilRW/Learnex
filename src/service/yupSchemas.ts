import * as Yup from 'yup';

export const signUpSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required"),

  username: Yup.string()
    .required("Username is required")
    .min(6, "Username must be at least 6 characters long"),

  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
    
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(12, "Password must be at most 12 characters long")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter"),
    
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'),], "Passwords must match")
    .required("Confirm password is required")
    .min(6, "Confirm password must be at least 6 characters long")
    .max(12, "Confirm password must be at most 12 characters long"),
});
