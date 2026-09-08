import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// Trigger: Comment Submit
app.post('/internal/triggers/on-comment-submit', async (c) => {
  console.log('TRIGGER FIRED: CommentSubmit');

  try {
    const req = await c.req.json();
    const commentBody = req.comment?.body;
    const commentId = req.comment?.id;

    console.log('Comment body:', commentBody);
    console.log('Comment ID:', commentId);

    // TODO: Implement bot logic here
    // - Initialize GraphQL client with settings
    // - Process comment with CommentGenerator
    // - Submit response comment
  } catch (error) {
    console.error('Error in comment trigger:', error);
  }

  return c.json({ status: 'ok' });
});

// Trigger: Post Submit
app.post('/internal/triggers/on-post-submit', async (c) => {
  console.log('TRIGGER FIRED: PostSubmit');

  try {
    const req = await c.req.json();
    console.log('Post ID:', req.post?.id);

    // TODO: Implement bot logic for posts
  } catch (error) {
    console.error('Error in post trigger:', error);
  }

  return c.json({ status: 'ok' });
});

export default app;
