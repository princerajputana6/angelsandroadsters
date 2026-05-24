import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateBlogContent(topic, category = 'Adventure') {
  try {
    const prompt = `You are a professional content writer for Angels & Roadsters, a premium motorcycle riding and adventure company in India. 

Write a comprehensive, engaging blog post about: "${topic}"

Category: ${category}

Requirements:
1. Write in an exciting, adventurous tone that appeals to motorcycle enthusiasts
2. Include practical tips and insights
3. Make it SEO-friendly with natural keyword usage
4. Length: 1200-1500 words
5. Use short paragraphs for readability
6. Include subheadings (use ## for markdown)
7. Add a compelling introduction and conclusion
8. Reference Indian riding culture, roads, and destinations where relevant

Format your response as JSON with this structure:
{
  "title": "Catchy, SEO-friendly title (max 60 characters)",
  "excerpt": "Compelling summary (150-160 characters)",
  "content": "Full blog content in markdown format with ## headings",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO meta title (max 60 characters)",
  "metaDescription": "SEO meta description (max 160 characters)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Write the blog post now:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer specializing in motorcycle adventure and travel content. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq');
    }

    const blogData = JSON.parse(response);
    return blogData;
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Failed to generate blog content: ${error.message}`);
  }
}

export async function generateBlogImages(topic) {
  const queries = [
    `${topic} motorcycle adventure`,
    `${topic} riding`,
    `${topic} motorcycle`,
  ];

  const images = queries.map((query, index) => {
    const encodedQuery = encodeURIComponent(query);
    return `https://images.unsplash.com/photo-${1500000000000 + index}?w=1200&q=80&fit=crop&auto=format&${encodedQuery}`;
  });

  return images;
}

export async function improveBlogContent(currentContent, improvementRequest) {
  try {
    const prompt = `You are editing a blog post for Angels & Roadsters, a premium motorcycle riding company.

Current content:
${currentContent}

Improvement request: ${improvementRequest}

Provide the improved version of the content in markdown format. Keep the same structure but enhance based on the request.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert content editor. Provide improved content that maintains the original structure while implementing requested changes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 4000,
    });

    return completion.choices[0]?.message?.content || currentContent;
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Failed to improve content: ${error.message}`);
  }
}
