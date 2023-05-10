import fetchBlogPostsMetadataFromFileSystem from "../../../src/services/blog-posts/fetch-blog-posts-metadata-from-file-system";

const MOCK_POSTS_DIR = "tests/fixtures/MOCK_posts";

describe("fetchBlogPostsMetadataFromFileSystem", () => {
  test("count of posts should be 2 (the number of valid mock posts)", () => {
    const expected = 2;
    const actual = fetchBlogPostsMetadataFromFileSystem(MOCK_POSTS_DIR).length;
    expect(expected).toEqual(actual);
  });

  test("post with wrong metadata should not be present in posts list", () => {
    const actual = fetchBlogPostsMetadataFromFileSystem(MOCK_POSTS_DIR).find(
      (post: { date: string; slug: string; title: string }) =>
        post.slug === "wrong-metadata-blog-post"
    );
    expect(actual).toBeUndefined();
  });

  test("posts metadata should be sorted by date DESC in posts list", () => {
    const actual = fetchBlogPostsMetadataFromFileSystem(MOCK_POSTS_DIR)[0];
    expect(actual.slug).toEqual("newest-blog-post");
  });
});
