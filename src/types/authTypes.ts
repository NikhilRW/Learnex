export interface signUpData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface signInData {
  usernameOrEmail: string;
  password: string;
}

export interface forgotPasswordData {
  password: string;
  confirmPassword: string;
}
