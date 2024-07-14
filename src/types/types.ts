export interface InstagramPostDetails {
  title: string;
  imgElements: string[];
  allCom: Comment[];
  videoElements: [];
  likes: number;
  datePost: string;
}

export interface Comment {
  commentDate: string;
  owner: string;
  finalComment: string;
  likesNumber: number;
  responses?: ResponseComment[];
}
export interface ResponseComment {
  originalOwnerOfComment: string;
  owner: string;
  finalComment: string;
  commentDate: string;
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
