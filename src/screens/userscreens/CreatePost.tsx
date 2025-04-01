import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define Navigation Stack Type
type RootStackParamList = {
  Post: undefined;
  PostWithKeyboard: undefined;
  ImgPost: undefined;
  Posting: undefined;
  ConfirmDiscard: undefined;
};

type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Post Screen
const PostScreen: React.FC<ScreenProps<'Post'>> = ({ navigation }) => {
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TextInput style={styles.input} placeholder="Share your experience..." multiline />
        <Button title="Post" onPress={() => navigation.navigate('ImgPost')} />
      </View>
      <View style={styles.profile}>
        <Text>Peter Parker</Text>
      </View>
      <Icon name="image" size={30} onPress={() => navigation.navigate('ImgPost')} />
    </KeyboardAvoidingView>
  );
};

// Post with Keyboard Active
const PostWithKeyboardScreen: React.FC<ScreenProps<'PostWithKeyboard'>> = ({ navigation }) => {
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TextInput style={styles.input} placeholder="Share your experience..." multiline />
        <Button title="Post" onPress={() => navigation.navigate('ImgPost')} />
      </View>
      <View style={styles.profile}>
        <Text>Peter Parker</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

// Image Post Screen
const ImgPostScreen: React.FC<ScreenProps<'ImgPost'>> = ({ navigation }) => {
  const imgData = Array(9).fill(null); // To create an empty grid
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Share your experience..." />
      <Button title="Add" onPress={() => console.log('Add Image')} />
      <FlatList
        numColumns={3}
        data={imgData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={() => (
          <View style={styles.imageBox}>
            <Icon name="camera" size={30} />
          </View>
        )}
      />
      <Button title="Next" onPress={() => navigation.navigate('Posting')} />
    </View>
  );
};

// Post Settings Screen
const PostingScreen: React.FC<ScreenProps<'Posting'>> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Share your experience..." multiline />
      <Text>Who can see your post?</Text>
      <Picker style={styles.picker}>
        <Picker.Item label="Public" value="public" />
        <Picker.Item label="Private" value="private" />
      </Picker>
      <Text>Comments</Text>
      <Picker style={styles.picker}>
        <Picker.Item label="Public" value="public" />
        <Picker.Item label="Private" value="private" />
        <Picker.Item label="Off" value="off" />
      </Picker>
      <Text>Section</Text>
      <Picker style={styles.picker}>
        <Picker.Item label="Normal" value="normal" />
        <Picker.Item label="Event" value="event" />
        <Picker.Item label="News" value="news" />
      </Picker>
      <Button title="Post" onPress={() => navigation.navigate('ConfirmDiscard')} />
    </View>
  );
};

// Confirm Discard Screen (Modal)
const ConfirmDiscardScreen: React.FC<ScreenProps<'ConfirmDiscard'>> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

return (
    <View style={styles.container}>
      <Button title="Discard" onPress={() => setModalVisible(true)} />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Do you want to discard?</Text>
            <Button title="Yes" onPress={() => navigation.navigate('Post')} />
            <Button title="No" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Main App Component with Navigation
const CreatePost = () => {
  const headerShown = {headerShown:false}
  return (
    <Stack.Navigator initialRouteName="Post" >
      <Stack.Screen options={headerShown} name="Post" component={PostScreen} />
      <Stack.Screen options={headerShown} name="PostWithKeyboard" component={PostWithKeyboardScreen} />
      <Stack.Screen options={headerShown} name="ImgPost" component={ImgPostScreen} />
      <Stack.Screen options={headerShown} name="Posting" component={PostingScreen} />
      <Stack.Screen options={headerShown} name="ConfirmDiscard" component={ConfirmDiscardScreen} />
    </Stack.Navigator>
  );
};

// Styles for the components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  profile: {
    marginTop: 10,
  },
  imageBox: {
    width: '30%',
    height: 100,
    margin: 5,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default CreatePost;