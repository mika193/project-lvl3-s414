import WatchJS from 'melanke-watchjs';
import { isURL } from 'validator';
import axios from 'axios';
import _ from 'lodash';
import 'bootstrap/js/dist/modal';
import getData from './getData';
import createModal from './modal';

const getAction = (actionsList, param) => actionsList.find(({ check }) => check(param));

const { watch } = WatchJS;
const updateInterval = 5000;

export default () => {
  const addField = document.querySelector('[data-name = add-field]');
  const addForm = document.querySelector('[data-name = add-form]');
  const addButton = document.querySelector('[data-name = add-button]');
  const invalidFeedbackField = document.querySelector('.invalid-feedback');
  const errorField = document.querySelector('.errors');
  const proxiUrl = 'https://cors-anywhere.herokuapp.com/';

  const getRequestHref = href => `${proxiUrl}${href.split('//').slice(1).join('')}`;
  const getClassName = value => `is-${value}`;

  const state = {
    feedbackText: '',
    requestHref: '',
    hrefsList: new Set(),
    chanels: [],
    articles: [],
    formStatus: 'initial',
    error: '',
    update: 'not-updated',
  };

  const validationActions = [
    {
      check: value => value === '',
      process: () => ({
        formStatus: 'initial',
      }),
    },

    {
      check: value => !(isURL(value)),
      process: () => ({
        feedbackText: 'Введите URL, например: https://mail.ru',
        formStatus: 'invalid',
      }),
    },

    {
      check: value => state.hrefsList.has(value),
      process: () => ({
        feedbackText: 'Такой URL уже есть в списке',
        formStatus: 'invalid',
      }),
    },

    {
      check: value => !state.hrefsList.has(value),
      process: () => ({
        feedbackText: '',
        formStatus: 'valid',
      }),
    },
  ];

  const formActions = {
    initial: () => {
      addField.classList.remove('is-valid', 'is-invalid');
      addField.disabled = false;
      addButton.disabled = true;
      addButton.textContent = 'Submit';
    },
    validation: (newClass) => {
      const oldClass = newClass === 'valid' ? 'invalid' : 'valid';
      addField.disabled = false;
      addField.classList.add(getClassName(newClass));
      addField.classList.remove(getClassName(oldClass));
      addButton.textContent = 'Submit';
      addButton.disabled = newClass === 'invalid';
    },
    valid: () => formActions.validation('valid'),
    invalid: () => formActions.validation('invalid'),
    sending: () => {
      addButton.disabled = true;
      addButton.textContent = 'Searching...';
      addField.disabled = true;
    },
    reset: () => {
      addForm.reset();
    },
  };

  watch(state, 'feedbackText', () => {
    invalidFeedbackField.textContent = state.feedbackText;
  });

  watch(state, 'formStatus', () => {
    formActions[state.formStatus]();
  });

  watch(state, 'chanels', () => {
    const { chanels } = state;
    const chanelsList = document.querySelector('.feeds');
    const newChanelsList = document.createElement('ul');
    newChanelsList.classList.add('feeds', 'list-group');

    chanels.forEach(({ title, description }) => {
      const chanel = document.createElement('li');
      chanel.classList.add('list-group-item');
      const chanelContent = `<h3>${title}</h3><p>${description}</p>`;
      chanel.innerHTML = chanelContent;
      newChanelsList.append(chanel);
    });

    chanelsList.replaceWith(newChanelsList);
  });

  watch(state, 'articles', () => {
    const articlesList = document.querySelector('.articles');
    const modalsContainer = document.querySelector('.modals');
    const newArticlesList = document.createElement('ul');
    const newmodalsContainer = document.createElement('div');
    newArticlesList.classList.add('articles', 'list-group');
    newmodalsContainer.classList.add('modals');

    state.articles.forEach(({ name, href, text }, index) => {
      const article = document.createElement('li');
      article.className = 'd-flex list-group-item justify-content-between align-items-center';
      const modalId = `modal${index}`;
      const articleContent = `<a href="${href}">${name}</a><button class="btn btn-info ml-3" type="button" data-toggle="modal" data-target="#${modalId}">Подробнее</button>`;
      article.innerHTML = articleContent;
      newArticlesList.append(article);
      const modal = createModal(name, text, modalId);
      newmodalsContainer.append(modal);
    });

    articlesList.replaceWith(newArticlesList);
    modalsContainer.replaceWith(newmodalsContainer);
  });

  watch(state, 'error', () => {
    errorField.textContent = state.error;
  });

  const update = () => {
    const requests = Array.from(state.hrefsList).map(href => axios.get(getRequestHref(href)));
    Promise.all(requests).then((responses) => {
      try {
        const articles = responses.map(({ data }) => getData(data).articles).flat();
        const newArticles = _.differenceBy(articles, state.articles, 'name');
        if (newArticles.length > 0) {
          state.articles = [...newArticles, ...state.articles];
        }
      } catch (e) {
        console.log(e);
      } finally {
        setTimeout(update, updateInterval);
      }
    }).catch(() => {
      setTimeout(update, updateInterval);
    });
  };

  addField.addEventListener('input', ({ target }) => {
    state.error = '';
    const { process } = getAction(validationActions, target.value);
    const newParams = process();
    state.requestHref = getRequestHref(target.value);
    Object.assign(state, newParams);
  });

  addForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    if (state.formStatus === 'valid') {
      state.formStatus = 'sending';
      axios.get(state.requestHref)
        .then((response) => {
          try {
            const { chanel, articles } = getData(response.data);
            state.chanels.push(chanel);
            state.articles = [...state.articles, ...articles];
            state.hrefsList.add(addField.value);
            state.formStatus = 'reset';
            if (state.update === 'not-updated') {
              state.update = 'updated';
              setTimeout(update, updateInterval);
            }
          } catch (e) {
            state.formStatus = 'invalid';
            state.feedbackText = 'Данный URL не является RSS';
          }
        }).catch(() => {
          state.error = 'Произошла ошибка сети. Попробуйте повторить запрос';
          state.formStatus = 'valid';
        });
    }
  });

  addForm.addEventListener('reset', () => {
    state.formStatus = 'initial';
  });
};
