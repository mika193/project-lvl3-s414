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
    const name = article.querySelector('title');
    const href = article.querySelector('link');
    return { name, href };
  });

  return chanel;
};
