(function() {
  // constants
  // -------------------------------------------------------------------------------------------
  const SCREEN_ID_LOADING = 'screenLoading';
  const SCREEN_ID_START = 'screenStart';
  const SCREEN_ID_QUESTIONS = 'screenQuestions';
  const SCREEN_ID_DONE = 'screenDone';
  const SCREEN_ID_ERROR = 'screenError';

  const ANSWER_NO = '0';
  const ANSWER_YES = '1';
  const ANSWER_EMPTY = '2';

  const TEST_GENDER_MALE = 'm';
  const TEST_GENDER_FEMALE = 'w';

  const TEST_STATUS_IN_PROGRESS = 'inProgress';

  const KEY_CODE_ENTER = 'Enter';
  const KEY_CODE_SPACE = 'Space';
  const KEY_CODE_YES = 'KeyL';
  const KEY_CODE_NO = 'KeyY';

  const EVENT_TYPE_START = 'start';
  const EVENT_TYPE_ANSWER = 'answer';

  const SEND_EVENTS_INTERVAL = 60000; // 1m

  // const API_HOST = 'http://localhost:5000';
  const STATIC_HOST = 'https://lywf.github.io/mmpi';
  const API_HOST = 'https://sleepy-headland-81525.herokuapp.com';

  // state
  // -------------------------------------------------------------------------------------------
  const appState = {
    testId: new URLSearchParams(window.location.search).get('tid'),
    test: null,
    questions: [],
    questionId: '',
    // questionContainerAnimationInProgress: false,
  };

  function setAppState(nextState) {
    Object.assign(appState, nextState);
  }

  function getAppState() {
    return appState;
  }

  function initAppStateTest(test) {
    const answers = test.answers.split('');
    const questionId = answers.indexOf(ANSWER_EMPTY);

    setAppState({
      test: { ...test, answers },
      questionId,
    });
  }

  function stringifyAnswers(answers) {
    return answers.join('');
  }

  // navigation
  // -------------------------------------------------------------------------------------------
  const navigationHandlers = {
    [SCREEN_ID_LOADING]: { onEnter: [], onExit: [] },
    [SCREEN_ID_START]: { onEnter: [], onExit: [] },
    [SCREEN_ID_QUESTIONS]: { onEnter: [], onExit: [] },
    [SCREEN_ID_DONE]: { onEnter: [], onExit: [] },
    [SCREEN_ID_ERROR]: { onEnter: [], onExit: [] },
  };

  function navigateTo(nextScreenId) {
    const currentScreenElement = document.querySelector('.screen_visible');
    const currentScreenId = currentScreenElement.id;
    const nextScreenElement = document.querySelector(`#${nextScreenId}`);

    navigationHandlers[nextScreenId].onEnter.forEach(handler => handler());

    currentScreenElement.classList.remove('screen_visible');
    nextScreenElement.classList.add('screen_visible');

    navigationHandlers[currentScreenId].onExit.forEach(handler => handler());
  }

  function registerNavigationHandlers(screenId, { onEnter = [], onExit = [] }) {
    Array.prototype.push.apply(navigationHandlers[screenId].onEnter, onEnter);
    Array.prototype.push.apply(navigationHandlers[screenId].onExit, onExit);
  }

  // requests
  // -------------------------------------------------------------------------------------------
  function fetchTest(testId) {
    return fetch(`${API_HOST}/v1/mmpi?interview=${testId}`)
      .then(response => response.json());
  }

  function fetchQuestions(gender) {
    return fetch(`${STATIC_HOST}/questions/${gender}.json`)
      .then(response => response.json());
  }

  function sendEvents(events) {
    console.log(events);

    return Promise.resolve();
  }

  function sendAnswer(testId, answers) {
    const answersStr = stringifyAnswers(answers);

    window.localStorage.setItem(testId, answersStr);

    return fetch(`${API_HOST}/v1/mmpi`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        interview: testId,
        answers: answersStr,
      }),
    })
      .catch(() => { /* do nothing, the previous answers will be sent with the next request */ });
  }

  // events
  // -------------------------------------------------------------------------------------------
  let eventsQueue = [];
  let preparedQueueLength = 0;

  function pushEvent(eventType, payload = {}) {
    eventsQueue.push({
      testId: getAppState().testId,
      eventType,
      date: new Date().toISOString(),
      payload,
    });
  }

  function prepareEvents() {
    preparedQueueLength = eventsQueue.length;

    return eventsQueue.slice(0);
  }

  function clearProcessedEvents() {
    eventsQueue = eventsQueue.slice(preparedQueueLength);
    preparedQueueLength = 0;
  }

  // templating
  // -------------------------------------------------------------------------------------------
  function renderDynamicTestProps(test) {
    document.querySelectorAll('.dynamicTestProp').forEach((element) => {
      const { prop } = element.dataset;

      if (prop && test[prop]) {
        element.textContent = test[prop];
      }
    });
  }

  function renderQuestions(questions) {
    const fragment = document.createDocumentFragment();
    const questionTemplate = document.querySelector('#questionTemplate');

    questions.forEach((question, number) => {
      const { content } = questionTemplate;

      content.querySelector('.question').dataset.id = number;
      content.querySelector('.question__text').textContent = question;

      const questionAnswerYesId = `qay${number}`;
      const questionAnswerNoId = `qan${number}`;
      const questionId = `qid${number}`;

      content.querySelector('.question__button_yes').id = questionAnswerYesId;
      content.querySelector('.question__button_yes').name = questionId;
      content.querySelector('.question__label_yes').htmlFor = questionAnswerYesId;

      content.querySelector('.question__button_no').id = questionAnswerNoId;
      content.querySelector('.question__button_no').name = questionId;
      content.querySelector('.question__label_no').htmlFor = questionAnswerNoId;

      fragment.appendChild(document.importNode(questionTemplate.content, true));
    });

    document.querySelector('.questionsList__container').appendChild(fragment);
  }

  function renderSubmitAnswers(testId, answers) {
    const { content } = document.querySelector('#submitAnswers');

    content.querySelector('input[name="testId"]').value = testId;
    content.querySelector('input[name="answers"]').value = stringifyAnswers(answers);

    document.querySelector('.question_active')
      .appendChild(document.importNode(content, true));
  }

  // screen start
  // -------------------------------------------------------------------------------------------
  function handleScreenStartEnter() {
    const { test } = getAppState();

    // set action button title
    if (test.status === TEST_STATUS_IN_PROGRESS) {
      document.querySelector('#screenStart .action_continue').classList.add('action_active');
    } else {
      document.querySelector('#screenStart .action_begin').classList.add('action_active');
    }

    document.addEventListener('keydown', handleEnterPressOnScreenStart);
    document.querySelector('#screenStart .button')
      .addEventListener('click', handleButtonClickOnScreenStart);
  }

  function handleScreenStartExit() {
    document.removeEventListener('keydown', handleEnterPressOnScreenStart);
    document.querySelector('#screenStart .button')
      .removeEventListener('click', handleButtonClickOnScreenStart);
  }

  function handleStartTestOnScreenStart() {
    pushEvent(EVENT_TYPE_START)
    navigateTo(SCREEN_ID_QUESTIONS);
  }

  function handleButtonClickOnScreenStart(event) {
    event.preventDefault();

    handleStartTestOnScreenStart();
  }

  function handleEnterPressOnScreenStart(event) {
    if (event.code === KEY_CODE_ENTER) {
      handleStartTestOnScreenStart();
    }
  }

  registerNavigationHandlers(SCREEN_ID_START, {
    onEnter: [handleScreenStartEnter],
    onExit: [handleScreenStartExit],
  });

  // screen questions
  // -------------------------------------------------------------------------------------------
  function selectInitialQuestionOnEnterScreenQuestions() {
    const { questionId } = getAppState();

    document.querySelector('#screenQuestions .questionsList')
      .classList.add('questionsList_view');
    document.querySelectorAll('#screenQuestions  .question').item(questionId)
      .classList.add('question_active');
    document.querySelector('#screenQuestions .questionsList__container')
      .style.transform = `translateY(-${questionId}00vh)`;
  }

  function addEventsOnEnterScreenQuestions() {
    document.addEventListener('keydown', handleKeyPressOnScreenQuestions);

    document.querySelector('#screenQuestions .questionsList')
      .addEventListener('keydown', handleLabelKeyPressOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList')
      .addEventListener('change', handleAnswerChangeOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList')
      .addEventListener('submit', handleSubmitAnswers);

    // document.querySelector('.questionsList__container')
    //   .addEventListener('transitionrun', handleContainerAnimationStartOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList__container')
      .addEventListener('transitionstart', handleContainerAnimationStartOnScreenQuestions);
    // document.querySelector('.questionsList__container')
    //   .addEventListener('transitioncancel', handleContainerAnimationStopOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList__container')
      .addEventListener('transitionend', handleContainerAnimationStopOnScreenQuestions);
  }

  function removeEventsOnEnterScreenQuestions() {
    document.removeEventListener('keydown', handleKeyPressOnScreenQuestions);

    document.querySelector('#screenQuestions .questionsList')
      .removeEventListener('keydown', handleLabelKeyPressOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList')
      .removeEventListener('change', handleAnswerChangeOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList')
      .removeEventListener('submit', handleSubmitAnswers);

    // document.querySelector('.questionsList__container')
    //   .removeEventListener('transitionrun', handleContainerAnimationStartOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList__container')
      .removeEventListener('transitionstart', handleContainerAnimationStartOnScreenQuestions);
    // document.querySelector('.questionsList__container')
    //   .removeEventListener('transitioncancel', handleContainerAnimationStopOnScreenQuestions);
    document.querySelector('#screenQuestions .questionsList__container')
      .removeEventListener('transitionend', handleContainerAnimationStopOnScreenQuestions);
  }

  registerNavigationHandlers(SCREEN_ID_QUESTIONS, {
    onEnter: [selectInitialQuestionOnEnterScreenQuestions, addEventsOnEnterScreenQuestions],
    onExit: [removeEventsOnEnterScreenQuestions],
  });

  // ---

  function handleKeyPressOnScreenQuestions(event) {
    // const { questionContainerAnimationInProgress } = getAppState();

    if (event.code === KEY_CODE_YES) {
      document.querySelector('#screenQuestions .question_active .question__label_yes').click();
    }

    if (event.code === KEY_CODE_NO) {
      document.querySelector('#screenQuestions .question_active .question__label_no').click();
    }

    if (event.code === KEY_CODE_ENTER) {
      const button = document.querySelector('#screenQuestions .submitAnswers button');

      if (button) {
        button.click();
      }
    }
  }

  function handleLabelKeyPressOnScreenQuestions(event) {
    const wrapper = event.target.closest('.question__answer');
    const insideAnswerBlock = wrapper !== null;
    // const { questionContainerAnimationInProgress } = getAppState();

    if (
      insideAnswerBlock &&
      (event.code === KEY_CODE_ENTER || event.code === KEY_CODE_SPACE)
    ) {
      wrapper.querySelector('.question__label').click();
    }
  }

  function handleAnswerChangeOnScreenQuestions(event) {
    const wrapper = event.target.closest('.question__answer');
    const insideAnswerBlock = wrapper !== null;
    // const { questionContainerAnimationInProgress } = getAppState();

    if (insideAnswerBlock) {
      // TODO Wait for animation instead of setTimeout?
      setTimeout(nextQuestion, 450);
    }
  }

  function handleContainerAnimationStartOnScreenQuestions(event) {
    if (event.target === event.currentTarget) {
      document.querySelectorAll('#screenQuestions .question_active .question__button')
        .forEach((element) => {
          element.disabled = true;
        });
      // setAppState({ questionContainerAnimationInProgress: true });
    }
  }
  function handleContainerAnimationStopOnScreenQuestions(event) {
    if (event.target === event.currentTarget) {
      document.querySelectorAll('#screenQuestions .question_active .question__button')
        .forEach((element) => {
          element.disabled = false;
        });
      // setAppState({ questionContainerAnimationInProgress: false });
    }
  }

  function handleSubmitAnswers(event) {
    event.preventDefault();

    console.log(event);

    navigateTo(SCREEN_ID_DONE);
  }

  // ---

  function nextQuestion() {
    const container = document.querySelector('#screenQuestions .questionsList__container');
    const activeQuestionElement = document.querySelector('#screenQuestions .question_active');
    const nextQuestionElement = activeQuestionElement.nextElementSibling;
    const { testId, test, questionId } = getAppState();
    const answer = activeQuestionElement.querySelector('.question__button:checked').value;
    const answers = test.answers.slice(0);

    pushEvent(EVENT_TYPE_ANSWER, {
      questionId,
      answer,
      prevAnswer: answers[questionId],
    });
    answers[questionId] = answer;
    setAppState({ test: { ...test, answers } });
    sendAnswer(testId, answers);

    if (nextQuestionElement === null) {
      renderSubmitAnswers(testId, test.answers);
    } else {
      const nextQuestionId = nextQuestionElement.dataset.id;

      setAppState({ questionId: nextQuestionId });

      activeQuestionElement.classList.remove('question_active');
      nextQuestionElement.classList.add('question_active');
      container.style.transform = `translateY(-${nextQuestionId}00vh)`;
    }
  }

  // main
  // -------------------------------------------------------------------------------------------

  function processEvents() {
    const events = prepareEvents();
    const nextTick = () => setTimeout(() => processEvents(), SEND_EVENTS_INTERVAL);

    if (events.length > 0) {
      sendEvents(events)
        .then(() => clearProcessedEvents())
        .catch(() => { /* do nothing, the previous events will be sent with the next request */ })
        .finally(() => nextTick());
    } else {
      nextTick();
    }
  }

  processEvents();

  fetchTest(getAppState().testId)
    // TODO Error handling
    .catch(() => {})
    .then((test) => {
      initAppStateTest(test);
      renderDynamicTestProps(test);
    })
    .then(() => fetchQuestions(getAppState().test.gender))
    .then((questions) => {
      setAppState({ questions });
      renderQuestions(questions);
      navigateTo(SCREEN_ID_START);
    });
})();
