export interface InstagramPostDetails {
  title: string;
  image: string;
}

export interface AllData {
  posts: number;
  followers: number;
  postDetails: InstagramPostDetails[];
}
