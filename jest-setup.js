// jest-setup.js
import {Alert} from 'react-native';

jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

// This file can be used for global Jest setup, like mocking modules or setting up test utilities.