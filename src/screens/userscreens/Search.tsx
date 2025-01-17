import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { UserStackParamList } from '../../routes/UserStack';
import { RouteProp } from '@react-navigation/native';

type SearchScreenRouteProp = RouteProp<UserStackParamList, 'Search'>;

const Search = ({ route }: { route: SearchScreenRouteProp }) => {
  let searchText = undefined;
  try {
    searchText = route.params.searchText;
  } catch (error) {
    console.log(error);
  }
  return (
    <View>
      <Text>{searchText}</Text>
    </View>
  )
}

export default Search;

const styles = StyleSheet.create({})