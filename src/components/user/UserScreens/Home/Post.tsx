import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useTypedSelector } from '../../../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/Feather';
import { postType } from '../../../../types/userType';

const Post = ({ post }: { post: postType }) => {
    const isDark = useTypedSelector((state) => state.user.theme) === "dark";
    const screenWidth = Dimensions.get('window').width;
    const [imageHeight, setImageHeight] = useState(0);
    useEffect(() => {
        if (post.postImage) {
            const imageSource = Image.resolveAssetSource(post.postImage);
            if (imageSource) {
                const { width, height } = imageSource;
                const aspectRatio = height / width;
                const screenWidth = Dimensions.get('window').width;
                const newHeight = screenWidth * aspectRatio;
                setImageHeight(newHeight);
            }
        }
    }, [post.postImage]);

    return (
        <View key={post.id} style={styles.postContainer}>
            <View style={styles.postHeader}>
                <Image
                    source={post.userImage}
                    style={styles.postUserImage} />
                <Text style={styles.postUsername}>{post.user} </Text>
            </View>
            <Image source={post.postImage} style={{ ...styles.postImage, height: imageHeight }} />
            <View style={styles.postActions}>
                <Icon name="heart" size={24} color={isDark ? "white" : "black"} />
                <Icon name="repeat" size={24} color={isDark ? "white" : "black"} />
                <Icon name="message-circle" size={24} color={isDark ? "white" : "black"} />
                <Icon name="bookmark" size={24} color={isDark ? "white" : "black"} />
                <Icon name="share" size={24} color={isDark ? "white" : "black"} />
            </View>
        </View>
    )
};

export default Post

const styles = StyleSheet.create({
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    postUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        resizeMode: 'cover',
    },
    postUsername: {
        fontWeight: 'bold',
    },
    postImage: {
        width: '100%',
        height: 400,
        borderRadius: 15,
        resizeMode: 'cover',
    },
    postActions: {
        flexDirection: 'row',
        padding: 10,
        justifyContent: 'space-between',
    },

    postContainer: {
        marginBottom: 15,
        paddingHorizontal: 7,
    },
})