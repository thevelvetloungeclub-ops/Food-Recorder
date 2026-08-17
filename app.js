const STORAGE_KEY =
  'foodRecorderEntriesV1';

let entries =
  JSON.parse(
    localStorage.getItem(STORAGE_KEY) ||
    '[]'
  );

function todayIso() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function saveEntries() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries)
  );
}

function estimateCalories(text) {

  const value =
    String(text || '')
      .toLowerCase()
      .trim();

  if (!value) {
    return 0;
  }

  const known = [
    {
      words: ['cheese sandwich'],
      calories: 400
    },
    {
      words: ['2 cans of beer', 'two cans of beer'],
      calories: 360
    },
    {
      words: ['can of beer'],
      calories: 180
    },
    {
      words: ['large whisky', 'large whiskey'],
      calories: 110
    },
    {
      words: ['fish and chips'],
      calories: 950
    },
    {
      words: ['beans on toast'],
      calories: 420
    },
    {
      words: ['toast with jam'],
      calories: 250
    },
    {
      words: ['bowl of cereal'],
      calories: 300
    },
    {
      words: ['coffee with milk'],
      calories: 40
    },
    {
      words: ['cup of tea'],
      calories: 30
    },
    {
      words: ['chicken curry and rice'],
      calories: 750
    },
    {
      words: ['sunday roast'],
      calories: 850
    }
  ];

  for (const item of known) {

    if (
      item.words.some(
        word => value.includes(word)
      )
    ) {
      return item.calories;
    }

  }

  return 500;
}

function render() {

  const today =
    todayIso();

  const todays =
    entries.filter(
      item => item.date === today
    );

  const total =
    todays.reduce(
      (sum, item) =>
        sum + Number(item.calories || 0),
      0
    );

  document.getElementById(
    'todayTotal'
  ).textContent =
    total + ' kcal';

  const box =
    document.getElementById(
      'todayEntries'
    );

  if (!todays.length) {

    box.innerHTML =
      '<p class="note">No entries yet.</p>';

    return;
  }

  box.innerHTML =
    todays
      .slice()
      .reverse()
      .map(item => `
        <div class="entry">
          <div class="entry-title">
            ${escapeHtml(item.description)}
          </div>

          <div class="entry-meta">
            ${escapeHtml(item.meal)}
            · ${item.calories} kcal
          </div>

          <button
            class="delete"
            data-id="${item.id}"
          >
            Delete
          </button>
        </div>
      `)
      .join('');

  box.querySelectorAll(
    '.delete'
  ).forEach(button => {

    button.addEventListener(
      'click',
      function () {

        const deletedId =
          button.dataset.id;

        entries =
          entries.filter(
            item =>
              item.id !==
              deletedId
          );

        saveEntries();

        removeSyncedFoodEntry(
          deletedId
        );

        render();

      }
    );

  });

}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const description =
  document.getElementById(
    'description'
  );

const calories =
  document.getElementById(
    'calories'
  );

document.getElementById(
  'estimateBtn'
).addEventListener(
  'click',
  function () {

    const amount =
      estimateCalories(
        description.value
      );

    calories.value =
      amount || '';

    document.getElementById(
      'estimateNote'
    ).textContent =
      amount
        ? 'Approximate estimate: ' +
          amount +
          ' kcal. You can change it before saving.'
        : 'Type what you ate first.';

  }
);

document.getElementById(
  'saveBtn'
).addEventListener(
  'click',
  function () {

    const text =
      description.value.trim();

    const amount =
      Number(calories.value);

    if (!text) {
      alert(
        'Please enter what you ate or drank.'
      );
      return;
    }

    if (!amount) {
      alert(
        'Estimate or enter the calories first.'
      );
      return;
    }

    entries.push({
      id:
        Date.now().toString(36) +
        Math.random()
          .toString(36)
          .slice(2),
      description: text,
      calories: amount,
      meal:
        document.getElementById(
          'meal'
        ).value,
      date: todayIso(),
      created:
        new Date().toISOString(),
      synced: false
    });

    saveEntries();

    syncFoodEntries();

    description.value = '';
    calories.value = '';

    document.getElementById(
      'estimateNote'
    ).textContent =
      'Saved.';

    render();

  }
);

document.getElementById(
  'typeBtn'
).addEventListener(
  'click',
  function () {

    description.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    description.focus();

  }
);

document.getElementById(
  'voiceBtn'
).addEventListener(
  'click',
  function () {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert(
        'Voice recognition is not available in this browser yet.'
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      'en-GB';

    recognition.interimResults =
      false;

    recognition.maxAlternatives =
      1;

    recognition.onresult =
      function (event) {

        const text =
          event.results[0][0]
            .transcript;

        description.value =
          text;

        const amount =
          estimateCalories(text);

        calories.value =
          amount || '';

        document.getElementById(
          'estimateNote'
        ).textContent =
          amount
            ? 'Voice entry heard. Approximate estimate: ' +
              amount +
              ' kcal.'
            : 'Voice entry heard.';

      };

    recognition.onerror =
      function () {

        alert(
          'I could not hear that clearly. Please try again or type it.'
        );

      };

    recognition.start();

  }
);

const cameraInput =
  document.getElementById(
    'cameraInput'
  );

document.getElementById(
  'photoBtn'
).addEventListener(
  'click',
  function () {
    cameraInput.click();
  }
);

cameraInput.addEventListener(
  'change',
  function () {

    const file =
      cameraInput.files &&
      cameraInput.files[0];

    if (!file) {
      return;
    }

    document.getElementById(
      'estimateNote'
    ).textContent =
      'Photo saved for analysis. Automatic photo calorie estimation is the next feature we will connect.';

  }
);

render();

startFoodFirebase();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./service-worker.js')
    .catch(() => {});
}


/* -------------------------
   FIREBASE FOOD SYNC
-------------------------- */

const firebaseConfig = {
  apiKey:
    "AIzaSyANLPpaiqf2I6J9F9uwl6FqiVky3fVIgB8",
  authDomain:
    "food-recorder-sync.firebaseapp.com",
  databaseURL:
    "https://food-recorder-sync-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:
    "food-recorder-sync",
  storageBucket:
    "food-recorder-sync.firebasestorage.app",
  messagingSenderId:
    "677914885520",
  appId:
    "1:677914885520:web:b9401754f77f6d49b2c715"
};

let foodSyncUser = null;

function addFoodSyncControls() {

  if (
    document.getElementById(
      'foodSyncPanel'
    )
  ) {
    return;
  }

  const app =
    document.querySelector('.app');

  if (!app) {
    return;
  }

  const panel =
    document.createElement('div');

  panel.id =
    'foodSyncPanel';

  panel.className =
    'panel';

  panel.innerHTML = `
    <div style="text-align:center;">
      <strong>
        My Health Analyser Sync
      </strong>

      <p
        id="foodSyncStatus"
        class="note"
        style="margin-bottom:12px;"
      >
        Not connected
      </p>

      <button
        id="foodGoogleConnectBtn"
        type="button"
      >
        Connect with Google
      </button>
    </div>
  `;

  const totalCard =
    document.querySelector(
      '.total-card'
    );

  if (totalCard) {
    totalCard.insertAdjacentElement(
      'afterend',
      panel
    );
  } else {
    app.prepend(panel);
  }

  document
    .getElementById(
      'foodGoogleConnectBtn'
    )
    .addEventListener(
      'click',
      connectFoodGoogle
    );
}


function setFoodSyncStatus(message) {

  const status =
    document.getElementById(
      'foodSyncStatus'
    );

  if (status) {
    status.textContent =
      message;
  }
}


async function connectFoodGoogle() {

  try {

    const provider =
      new firebase.auth
        .GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: 'select_account'
    });

    await firebase
      .auth()
      .signInWithPopup(
        provider
      );

  } catch (error) {

    console.error(
      'Google sign-in failed:',
      error
    );

    setFoodSyncStatus(
      'Could not connect to Google.'
    );

    alert(
      'Google sign-in did not complete. Please try again.'
    );

  }
}


async function syncFoodEntries() {

  if (!foodSyncUser) {
    return;
  }

  const uid =
    foodSyncUser.uid;

  const unsynced =
    entries.filter(
      item => !item.synced
    );

  if (!unsynced.length) {

    setFoodSyncStatus(
      'Connected · everything is synced'
    );

    return;
  }

  setFoodSyncStatus(
    'Connected · syncing...'
  );

  for (const item of unsynced) {

    try {

      await firebase
        .database()
        .ref(
          'users/' +
          uid +
          '/foodEntries/' +
          item.id
        )
        .set({
          id:
            item.id,
          description:
            item.description,
          calories:
            Number(
              item.calories || 0
            ),
          meal:
            item.meal || '',
          date:
            item.date || '',
          created:
            item.created || '',
          updated:
            new Date()
              .toISOString()
        });

      item.synced =
        true;

    } catch (error) {

      console.error(
        'Food sync failed:',
        error
      );

      setFoodSyncStatus(
        'Connected · sync waiting'
      );

      saveEntries();
      return;
    }

  }

  saveEntries();

  setFoodSyncStatus(
    'Connected · everything is synced'
  );
}


async function removeSyncedFoodEntry(
  entryId
) {

  if (
    !foodSyncUser ||
    !entryId
  ) {
    return;
  }

  try {

    await firebase
      .database()
      .ref(
        'users/' +
        foodSyncUser.uid +
        '/foodEntries/' +
        entryId
      )
      .remove();

  } catch (error) {

    console.error(
      'Remote delete failed:',
      error
    );

  }
}


function startFoodFirebase() {

  addFoodSyncControls();

  try {

    if (!firebase.apps.length) {

      firebase.initializeApp(
        firebaseConfig
      );

    }

    firebase
      .auth()
      .setPersistence(
        firebase.auth
          .Auth.Persistence.LOCAL
      )
      .catch(
        error =>
          console.error(
            'Auth persistence:',
            error
          )
      );

    firebase
      .auth()
      .onAuthStateChanged(
        async user => {

          foodSyncUser =
            user || null;

          const button =
            document.getElementById(
              'foodGoogleConnectBtn'
            );

          if (!user) {

            setFoodSyncStatus(
              'Not connected'
            );

            if (button) {
              button.style.display =
                '';
            }

            return;
          }

          if (button) {
            button.style.display =
              'none';
          }

          setFoodSyncStatus(
            'Connected as ' +
            (
              user.email ||
              'Google user'
            )
          );

          await syncFoodEntries();

        }
      );

  } catch (error) {

    console.error(
      'Firebase startup failed:',
      error
    );

    setFoodSyncStatus(
      'Sync unavailable'
    );

  }
}

