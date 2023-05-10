import fetchBlogPostDataFromFileSystem from "../../../src/services/blog-posts/fetch-blog-post-data-from-file-system";

const MOCK_POSTS_DIR = "tests/fixtures/MOCK_posts";

describe("fetchBlogPostsMetadataFromFileSystem", () => {
  test("post metadata should not appear in post contents", () => {
    const actual = fetchBlogPostDataFromFileSystem("blog-post", MOCK_POSTS_DIR);
    expect(/2020-01-01/.test(actual.contents)).toBeFalsy();
  });
});
