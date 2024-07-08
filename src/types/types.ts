export interface InstagramPostDetails {
  title: string;
  imgElements: string[];
  allCom: Comment[];
  videoElements: [];
  likes: number;
}

interface Comment {
  owner: string;
  finalComment: string;
  likesNumber: number;
}

export interface AllData {
  posts: number;
  following: number;
  followers: number;
  links: string[];
  profileImg: string;
}
