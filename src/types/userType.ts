export type userState = {
    isLoggedIn:boolean,
    userProfileColor:string|null,
    theme:string,
    userNewlyOpenedApp:boolean|null,
    customColorPrefrence:boolean,
}

export type postType = {
    id:number,
    user:string,
    userImage:number,
    postImage:number,
    // TODO: number For The Development And Put Url For The Production

}