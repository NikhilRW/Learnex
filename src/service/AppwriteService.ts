import {ID, Account, Client} from 'appwrite';
import Config from 'react-native-config';
import Snackbar from 'react-native-snackbar';

const appwriteClient = new Client();
const AppwriteEndPoint: string = Config.APPWRITE_API_ENDPOINT!;
const AppwriteProjectID: string = Config.PROJECT_ID!;

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
}

export default AppwriteService;