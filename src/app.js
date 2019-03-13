import WatchJS from 'melanke-watchjs';
import { isURL } from 'validator';
import axios from 'axios';
import 'bootstrap/js/dist/modal';
import getChanelData from './getData';
import createModal from './modal';

const addField = document.querySelector('[data-name = add-field]');
const addForm = document.querySelector('[data-name = add-form]');
const addButton = document.querySelector('[data-name = add-button]');
const invalidFeedbackField = document.querySelector('.invalid-feedback');
const main = document.querySelector('main');
const proxiUrl = 'https://cors-anywhere.herokuapp.com/';

const state = {
  feedbackText: '',
  valid: 'initial',
  href: '',
  feedList: new Set(),
  submit: 'disabled',
  chanels: [],
  buttonText: 'Submit',
};

const validationActions = [
  {
    check: value => !(isURL(value)),
    process: () => ({
      feedbackText: 'Введите URL, например: https://mail.ru',
      valid: 'invalid',
    }),
  },

  {
    check: value => state.feedList.has(value),
    process: () => ({
      feedbackText: 'Такой URL уже есть в списке',
      valid: 'invalid',
    }),
  },

  {
    check: value => !state.feedList.has(value),
    process: () => ({
      feedbackText: '',
      valid: 'valid',
      submit: 'ready',
    }),
  },
];

const submitActions = [
  {
    check: value => value === 'submitted',
    process: () => {
      state.submit = 'processing';
      state.buttonText = 'Searching...';
      axios.get(`${proxiUrl}${state.href}`)
        .then((response) => {
          state.feedList.add(addField.value);
          addForm.reset();
          state.submit = 'disabled';
          state.buttonText = 'Submit';
          state.valid = 'initial';
          state.chanels.push(getChanelData(response.data));
        }).catch(error => console.log(error));
    },
  },

  {
    check: value => value === 'disabled',
    process: () => {
      addButton.disabled = true;
    },
  },

  {
    check: value => value === 'ready',
    process: () => {
      addButton.disabled = false;
    },
  },

  {
    check: value => value === 'processing',
    process: () => {
      addButton.disabled = true;
    },
  },
];

const getAction = (actionsList, param) => actionsList.find(({ check }) => check(param));

const { watch } = WatchJS;

watch(state, ['valid', 'feedbackText'], () => {
  if (state.valid === 'initial') {
    addField.classList.remove('is-valid', 'is-invalid');
    return;
  }
  const addingClassEnd = state.valid;
  invalidFeedbackField.textContent = state.feedbackText;
  const removingClassEnd = addingClassEnd === 'valid' ? 'invalid' : 'valid';
  addField.classList.add(`is-${addingClassEnd}`);
  addField.classList.remove(`is-${removingClassEnd}`);
});

watch(state, 'submit', () => {
  const { process } = getAction(submitActions, state.submit);
  process();
});

watch(state, 'chanels', () => {
  const { chanels } = state;
  const feedsList = document.querySelector('.feeds');
  const articlesList = document.querySelector('.articles');
  const newFeedsList = document.createElement('ul');
  const newArticlesList = document.createElement('ul');
  newFeedsList.classList.add('feeds', 'list-group');
  newArticlesList.classList.add('articles', 'list-group');

  chanels.forEach((chanel) => {
    const feed = document.createElement('li');
    const feedTitle = document.createElement('h3');
    const feedDescription = document.createElement('p');
    feedTitle.textContent = chanel.title.textContent;
    feedDescription.textContent = chanel.description.textContent;
    feed.append(feedTitle);
    feed.append(feedDescription);
    feed.classList.add('list-group-item');
    newFeedsList.append(feed);

    chanel.articles.forEach(({ name, href, text }, index) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = name;
      link.classList.add('col-8');
      const modalButton = document.createElement('button');
      modalButton.textContent = 'Подробнее';
      modalButton.classList.add('col-3');
      modalButton.type = 'button';
      modalButton.dataset.toggle = 'modal';
      const modalId = `modal${index}`;
      modalButton.dataset.target = `#${modalId}`;
      const modal = createModal(name, text, modalId);
      const article = document.createElement('li');
      article.classList.add('row');
      article.append(link);
      article.append(modalButton);
      newArticlesList.append(article);
      main.append(modal);
    });
  });

  feedsList.replaceWith(newFeedsList);
  articlesList.replaceWith(newArticlesList);
});

watch(state, 'buttonText', () => {
  addButton.textContent = state.buttonText;
});

export default () => {
  addField.addEventListener('input', ({ target }) => {
    const { process } = getAction(validationActions, target.value);
    const newParams = process();
    state.href = target.value.split('//').slice(1).join('');
    Object.keys(newParams).forEach((key) => {
      state[key] = newParams[key];
    });
  });

  addForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    if (state.submit === 'ready') {
      state.submit = 'submitted';
    }
  });
};
