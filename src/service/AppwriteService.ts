import {ID, Account, Client, Databases} from 'appwrite';
import Config from 'react-native-config';
import Snackbar from 'react-native-snackbar';
import {signUpData} from '../types/authTypes';

const appwriteClient = new Client();
const AppwriteEndPoint: string = Config.APPWRITE_API_ENDPOINT!;
const AppwriteProjectID: string = Config.PROJECT_ID!;
let databases:Databases;
type CreateUserAccount = {
  email: string;
  name: string;
  password: string;
};
type LoginUserAccount = {
  email: string;
  password: string;
};
class AppwriteService {
  account: Account;
  constructor() {
    appwriteClient.setEndpoint(AppwriteEndPoint).setProject(AppwriteProjectID);
    databases = new Databases(appwriteClient);
    this.account = new Account(appwriteClient);
  }
  async createUserAccount({email, name, password}: CreateUserAccount) {
    try {
      const newAccount = await this.account.create(
        ID.unique(10),
        email,
        password,
      );
      if (newAccount) {
        return this.login(email, password);
      }
    } catch (error) {
      Snackbar.show({text: String(error), duration: Snackbar.LENGTH_LONG});
      console.log('appwrite service :: createUserAccount():: ' + error);
    }
  }

  async login(email: string, password: string) {
    try {
      return await this.account.createEmailPasswordSession(email, password);
    } catch (error) {
      Snackbar.show({text: String(error), duration: Snackbar.LENGTH_LONG});
      console.log('appwrite service :: login():: ' + error);
    }
  }

  async getUserDetails() {
    try {
      return await this.account.get();
    } catch (error) {
      Snackbar.show({text: String(error), duration: Snackbar.LENGTH_LONG});
      console.log('appwrite service :: getUserDetails():: ' + error);
    }
  }

  async logout() {
    try {
      return await this.account.deleteSession('current');
    } catch (error) {
      Snackbar.show({text: String(error), duration: Snackbar.LENGTH_LONG});
      console.log('appwrite service :: logout():: ' + error);
    }
  }

  async registerUser({ fullName, email, username }: signUpData) {
    try {
      const response = await this.account.create(ID.unique(), email, 'password123', fullName);
      console.log("User registered successfully: ", response);
      const userId = response.$id;
      const dbResponse = await databases.createDocument(
        '66fedbea00067e169f89',
        '66fedca80028392fad14',
        ID.unique(),
        {
          userId,
          fullName,
          email,
          username,
        }
      );
      console.log("User details saved in database: ", dbResponse);
    } catch (error) {
      Snackbar.show({ text: String(error), duration: Snackbar.LENGTH_LONG });
      console.log('Error during registration: ', error);
    }
  }
}

export default AppwriteService;