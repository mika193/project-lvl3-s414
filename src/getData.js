export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  const title = doc.querySelector('title');
  const description = doc.querySelector('description');
  const articles = [...doc.querySelectorAll('item')];

  const chanel = {
    title,
    description,
    articles: [],
  };

  chanel.articles = articles.map((article) => {
    const name = article.querySelector('title').textContent;
    const href = article.querySelector('link').textContent;
    const text = article.querySelector('description').textContent;
    return { name, href, text };
  });

  return chanel;
};
