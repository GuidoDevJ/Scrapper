export interface InstagramPostDetails {
  title: string;
  imgElements: string[];
  allCom: Comment[];
  videoElements: [];
  likes: number;
  datePost: string;
}

interface Comment {
  commentDate: string;
  owner: string;
  finalComment: string;
  likesNumber: number;
}

export enum TypesOfContentSocialMedia {
  INSTAGRAM = 'POST',
  TIKTOK = 'REEL',
}

export interface AllData {
  posts: number;
  following: number;
  followers: number;
  links: string[];
  profileImg: string;
}
