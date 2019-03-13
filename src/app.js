import WatchJS from 'melanke-watchjs';
import { isURL } from 'validator';
import axios from 'axios';
import 'bootstrap/js/dist/modal';
import getChanelData from './getData';
import createModal from './modal';

const getAction = (actionsList, param) => actionsList.find(({ check }) => check(param));

const { watch } = WatchJS;

export default () => {
  const addField = document.querySelector('[data-name = add-field]');
  const addForm = document.querySelector('[data-name = add-form]');
  const addButton = document.querySelector('[data-name = add-button]');
  const invalidFeedbackField = document.querySelector('.invalid-feedback');
  const errorField = document.querySelector('.errors');
  const proxiUrl = 'https://cors-anywhere.herokuapp.com/';

  const state = {
    feedbackText: '',
    input: 'initial',
    href: '',
    feedList: new Set(),
    submit: 'disabled',
    chanels: [],
    buttonText: 'Submit',
    form: 'calm',
    modalIndex: 0,
    error: '',
  };

  const validationActions = [
    {
      check: value => value === '',
      process: () => ({
        input: 'initial',
        submit: 'disabled',
      }),
    },

    {
      check: value => !(isURL(value)),
      process: () => ({
        feedbackText: 'Введите URL, например: https://mail.ru',
        input: 'invalid',
      }),
    },

    {
      check: value => state.feedList.has(value),
      process: () => ({
        feedbackText: 'Такой URL уже есть в списке',
        input: 'invalid',
      }),
    },

    {
      check: value => !state.feedList.has(value),
      process: () => ({
        feedbackText: '',
        input: 'valid',
        submit: 'ready',
      }),
    },
  ];

  const formActions = {
    calm: () => {},
    reset: () => {
      addForm.reset();
      state.form = 'calm';
    },
  };

  const submitActions = {
    submitted: () => {
      state.submit = 'processing';
      state.buttonText = 'Searching...';
      state.input = 'disabled';
      axios.get(`${proxiUrl}${state.href}`)
        .then((response) => {
          try {
            const chanelData = getChanelData(response.data);
            state.chanels.push(chanelData);
            state.feedList.add(addField.value);
            state.form = 'reset';
            state.input = 'initial';
          } catch (e) {
            state.input = 'invalid';
            state.feedbackText = 'Данный URL не является RSS';
          } finally {
            state.submit = 'disabled';
            state.buttonText = 'Submit';
          }
        }).catch(() => {
          state.error = 'Произошла ошибка сети. Попробуйте повторить запрос';
          state.input = 'valid';
          state.submit = 'disabled';
          state.buttonText = 'Submit';
        });
    },
    disabled: () => {
      addButton.disabled = true;
    },
    ready: () => {
      addButton.disabled = false;
    },
    processing: () => {
      addButton.disabled = true;
    },
  };

  const getClassName = value => `is-${value}`;

  const inputActions = {
    initial: () => {
      addField.classList.remove('is-valid', 'is-invalid');
      addField.disabled = false;
    },

    disabled: () => {
      addField.disabled = true;
    },

    valid: () => {
      addField.disabled = false;
      addField.classList.add(getClassName('valid'));
      addField.classList.remove(getClassName('invalid'));
    },

    invalid: () => {
      addField.disabled = false;
      addField.classList.add(getClassName('invalid'));
      addField.classList.remove(getClassName('valid'));
    },
  };

  watch(state, ['input', 'feedbackText'], () => {
    inputActions[state.input]();
  });

  watch(state, 'feedbackText', () => {
    invalidFeedbackField.textContent = state.feedbackText;
  });

  watch(state, 'submit', () => {
    submitActions[state.submit]();
  });

  watch(state, 'form', () => {
    formActions[state.form]();
  });

  watch(state, 'chanels', () => {
    const { chanels } = state;
    const chanelsList = document.querySelector('.feeds');
    const articlesList = document.querySelector('.articles');
    const modalsContainer = document.querySelector('.modals');
    const newChanelsList = document.createElement('ul');
    const newArticlesList = document.createElement('ul');
    const newmodalsContainer = document.createElement('div');
    newChanelsList.classList.add('feeds', 'list-group');
    newArticlesList.classList.add('articles', 'list-group');
    newmodalsContainer.classList.add('modals');

    chanels.forEach(({ title, description, articles }) => {
      const chanel = document.createElement('li');
      chanel.classList.add('list-group-item');
      const chanelContent = `<h3>${title}</h3><p>${description}</p>`;
      chanel.innerHTML = chanelContent;
      newChanelsList.append(chanel);

      articles.forEach(({ name, href, text }) => {
        const article = document.createElement('li');
        article.classList.add('row');
        const modalId = `modal${state.modalIndex}`;
        const articleContent = `<a href="${href}" class="col-8">${name}</a><button class="col-3" type="button" data-toggle="modal" data-target="#${modalId}">Подробнее</button>`;
        article.innerHTML = articleContent;
        newArticlesList.append(article);
        const modal = createModal(name, text, modalId);
        state.modalIndex += 1;
        newmodalsContainer.append(modal);
      });
    });

    state.modalIndex = 0;
    chanelsList.replaceWith(newChanelsList);
    articlesList.replaceWith(newArticlesList);
    modalsContainer.replaceWith(newmodalsContainer);
  });

  watch(state, 'buttonText', () => {
    addButton.textContent = state.buttonText;
  });

  watch(state, 'error', () => {
    errorField.textContent = state.error;
  });

  addField.addEventListener('input', ({ target }) => {
    state.error = '';
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
