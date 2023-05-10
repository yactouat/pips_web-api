import { BlogPostMetaDto } from "pips_shared/dist/dtos";

const getPostsMetaSortedByDate = (
  posts: BlogPostMetaDto[]
): BlogPostMetaDto[] => {
  return posts
    .sort((a, b) => {
      return a.date < b.date ? 1 : -1;
    })
    .map((post) => {
      return {
        date: post.date,
        slug: post.slug,
        status: post.status,
        title: post.title,
      };
    });
};

export default getPostsMetaSortedByDate;
