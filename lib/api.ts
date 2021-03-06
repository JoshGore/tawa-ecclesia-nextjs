import Prismic from "@prismicio/client";
import { Document } from "@prismicio/client/types/documents";
import {
  LinkField,
  LinkType,
  PrismicDocument,
  SliceZone,
} from "@prismicio/types";
import { getPlaiceholder } from "plaiceholder";
import { Link, RichText, RichTextBlock } from "prismic-reactjs";

const REPOSITORY = process.env.PRISMIC_REPOSITORY_NAME ?? "tawa-website-poc";
const REF_API_URL = `https://${REPOSITORY}.cdn.prismic.io/api/v2`;
const GRAPHQL_API_URL = `https://${REPOSITORY}.cdn.prismic.io/graphql`;
// export const API_URL = 'https://your-repo-name.cdn.prismic.io/api/v2'
export const API_TOKEN = process.env.PRISMIC_API_TOKEN;
export const API_LOCALE = process.env.PRISMIC_REPOSITORY_LOCALE;

export const PrismicClient = Prismic.client(REF_API_URL, {
  accessToken: API_TOKEN,
});

export const prismicLinkResolver = function (doc: Document | PrismicDocument) {
  // if (doc.isBroken) {
  //   return "/not-found";
  // }
  if (doc.type === "homepage") {
    return "/";
  }
  if (doc.type === "general_page") {
    return "/" + doc.uid;
  }
  if (doc.type === "blog_page") {
    return "/articles";
  }
  if (doc.type === "blog_post") {
    return "/articles/" + doc.uid;
  }
  return "/";
};

export interface IEventData {
  title: RichTextBlock[];
  presenter: RichTextBlock[];
  description: RichTextBlock[];
  time: string;
}

export type IAllEventsData = IEventData[];

export async function getAllEvents(): Promise<IAllEventsData> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const eventDocuments = await PrismicClient.query(
    [
      Prismic.predicates.at("document.type", "event"),
      Prismic.predicates.dateAfter("my.event.event_date", yesterday),
    ],
    { orderings: "[my.event.event_date]", pageSize: 100 }
  );
  const eventData = eventDocuments.results.map((result) => {
    return {
      title: result.data.title,
      presenter: result.data.presenter,
      description: result.data.event_description,
      time: result.data.event_date,
    };
  });
  return eventData;
}

interface ILinkData {
  label: string;
  url: string;
}

export interface IFooterData {
  footerText: RichTextBlock[];
  footerLinks: ILinkData[];
  footerIcon: IImageData;
}
// inteface IFoot
export async function getFooterData(): Promise<IFooterData> {
  var layoutDocument = await PrismicClient.getSingle("layout", {});
  return {
    footerLinks: layoutDocument.data.footer_links.map(
      (link: PrismicLinkField) => {
        return {
          label: RichText.asText(link.link_label),
          url: prismicLinkResolver(link.link),
        };
      }
    ),
    footerText: layoutDocument.data.footer_text,
    footerIcon: {
      url: layoutDocument.data.footer_icon.url,
      alt: layoutDocument.data.footer_icon.alt,
    },
  };
}

export interface IHeaderData {
  siteTagLine: RichTextBlock[];
  siteLogo: IImageData;
  headerLinks: ILinkData[];
}

interface PrismicLinkField {
  link_label: RichTextBlock[];
  link: PrismicDocument;
}

export async function getHeaderData(): Promise<IHeaderData> {
  var layoutDocument = await PrismicClient.getSingle("layout", {});
  return {
    siteTagLine: layoutDocument.data.site_tagline,
    siteLogo: {
      url: layoutDocument.data.site_logo.url,
      alt: layoutDocument.data.site_logo.alt,
    },
    headerLinks: layoutDocument.data.header_links.map(
      (link: PrismicLinkField) => {
        return {
          label: RichText.asText(link.link_label),
          url: prismicLinkResolver(link.link),
        };
      }
    ),
  };
}

export interface IHomePageData {
  title: RichTextBlock[];
  subtitle: RichTextBlock[];
  image: IImageData;
  textColor: string;
  showEvents: boolean;
}

export async function getHomePageData(): Promise<IHomePageData> {
  const homepage = await PrismicClient.getSingle("homepage", {});
  var plaiceholderData = await getPlaiceholder(homepage.data.hero_image.url);
  return {
    title: homepage.data.title,
    subtitle: homepage.data.subtitle,
    image: {
      url: homepage.data.hero_image.url,
      alt: homepage.data.hero_image.alt,
      blurDataURL: plaiceholderData.base64,
    },
    textColor: homepage.data.title_color,
    showEvents: homepage.data.show_events,
  };
}

interface IPageId {
  params: {
    id: any;
  };
}

export async function getAllPageIds(): Promise<IPageId[]> {
  const pages = await PrismicClient.query(
    Prismic.predicates.at("document.type", "general_page"),
    { pageSize: 100 }
  );
  var ids = pages.results.map((result) => {
    return {
      params: {
        id: result.uid,
      },
    };
  });
  return ids;
}

export interface IPageData {
  title: RichTextBlock[];
  subtitle: RichTextBlock[];
  heroImage: IImageData;
  headingType: "Full Bleed" | "Standard";
  textColor: string;
  body: ISliceData[];
}

export interface ISliceData {
  slice_type: string;
  slice_label: string | null;
  items: any[];
  primary: any;
}

export async function getPageData(uid: string): Promise<IPageData> {
  var pageData = await PrismicClient.getByUID("general_page", uid, {});
  var plaiceholderData = await getPlaiceholder(pageData.data.hero_image.url);
  return {
    title: pageData.data.title,
    subtitle: pageData.data.subtitle,
    heroImage: {
      url: pageData.data.hero_image.url,
      alt: pageData.data.hero_image.alt,
      blurDataURL: plaiceholderData.base64,
    },
    headingType: pageData.data.hero_display,
    textColor: pageData.data.title_color,
    body: pageData.data.body,
  };
}

export interface IBlogPageData {
  title: string;
}

export async function getBlogPageData(): Promise<IBlogPageData> {
  const blogpage = await PrismicClient.getSingle("blog_page", {});
  return {
    title: RichText.asText(blogpage.data.title),
  };
}

export interface IPostData {
  url: string;
  title: string;
  titleImage: IImageData;
  summary: RichTextBlock[];
  body: SliceZone;
  tags: string[];
  datePublished: string;
  readingTime: number;
  relatedPosts?: IPostData[];
}

export function getTextReadingTime(text: string) {
  return Math.round(text.split(" ").filter((word) => word !== "").length / 220);
}

export function getSliceZoneTextReadingTime(sliceZone: any) {
  return sliceZone
    .filter((slice: any) => slice.slice_type == "text")
    .reduce((totalReadingTime: number, slice: any) => {
      var readingTime = getTextReadingTime(
        RichText.asText(slice.primary.text as RichTextBlock[])
      );
      return totalReadingTime + readingTime;
    }, 0);
}

export async function getPostData(uid: string): Promise<IPostData> {
  var postData = await PrismicClient.getByUID("blog_post", uid, {});
  var plaiceholderData = await getPlaiceholder(postData.data.title_image.url);
  var postIds = postData.data.linked_posts
    .map(({ post }: { post: Document }) => post.id)
    .filter((id: string) => id !== undefined);
  var relatedPostsData: IPostData[] = [];
  if (postIds && postIds.length) {
    var relatedPosts = await PrismicClient.getByIDs(postIds, {});
    relatedPostsData = await Promise.all(
      relatedPosts.results.map(async (doc) => {
        var plaiceholderData = await getPlaiceholder(doc.data.title_image.url);
        return {
          url: prismicLinkResolver(doc),
          title: RichText.asText(doc.data.title),
          titleImage: {
            url: doc.data.title_image.url,
            alt: doc.data.title_image.alt,
            blurDataURL: plaiceholderData.base64,
          },
          summary: doc.data.summary,
          body: doc.data.body,
          tags: doc.data.article_tags.map(({ tag }: any) => tag),
          datePublished: doc.data.release_date,
          readingTime: getSliceZoneTextReadingTime(doc.data.body),
        };
      })
    );
  }
  return {
    url: prismicLinkResolver(postData),
    title: RichText.asText(postData.data.title),
    titleImage: {
      url: postData.data.title_image.url,
      alt: postData.data.title_image.alt,
      blurDataURL: plaiceholderData.base64,
    },
    summary: postData.data.summary,
    body: postData.data.body,
    tags: postData.data.article_tags.map(({ tag }: any) => tag),
    datePublished: postData.data.release_date,
    readingTime: getSliceZoneTextReadingTime(postData.data.body),
    relatedPosts: relatedPostsData,
  };
}

export async function getAllPostIds(): Promise<IPageId[]> {
  const pages = await PrismicClient.query(
    Prismic.predicates.at("document.type", "blog_post"),
    { pageSize: 100 }
  );
  var ids = pages.results.map((result) => {
    return {
      params: {
        id: result.uid,
      },
    };
  });
  return ids;
}

export async function getAllPosts(): Promise<IPostData[]> {
  const postDocuments = await PrismicClient.query(
    [Prismic.predicates.at("document.type", "blog_post")],
    { orderings: "[my.blog_post.release_date desc]", pageSize: 100 }
  );
  var postsData = await Promise.all(
    postDocuments.results.map(async (doc) => {
      var plaiceholderData = await getPlaiceholder(doc.data.title_image.url);
      return {
        url: prismicLinkResolver(doc),
        title: RichText.asText(doc.data.title),
        titleImage: {
          url: doc.data.title_image.url,
          alt: doc.data.title_image.alt,
          blurDataURL: plaiceholderData.base64,
        },
        summary: doc.data.summary,
        body: doc.data.body,
        tags: doc.data.article_tags.map(({ tag }: any) => tag),
        datePublished: doc.data.release_date,
        readingTime: getSliceZoneTextReadingTime(doc.data.body),
      };
    })
  );
  return postsData;
}
