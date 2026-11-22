
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
} from './Config.js';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const loginForm = document.getElementById('loginForm');
const status = document.getElementById('status');
const lettersBox = document.getElementById('letters');
const logoutButton = document.getElementById('logout');

async function deleteLetter(id, button) {
  const confirmed = confirm('از حذف این نامه مطمئنی؟');

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = 'در حال حذف...';

  const { error } = await supabase
    .from('letters')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('حذف نامه انجام نشد. دوباره امتحان کن.');
    button.disabled = false;
    button.textContent = 'حذف نامه';
    return;
  }

  await loadLetters();
}

async function loadLetters() {
  status.textContent = 'در حال دریافت نامه‌ها...';

  const { data, error } = await supabase
    .from('letters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    status.textContent = 'دریافت نامه‌ها ناموفق بود.';
    console.error(error);
    return;
  }

  status.textContent = data.length
    ? `${data.length} نامه در صندوق داری ♡`
    : 'هنوز نامه‌ای نرسیده است.';

  lettersBox.replaceChildren();

  data.forEach(letter => {
    const card = document.createElement('article');

    card.style.cssText =
      'background:#fff;border:1px solid #eadbd4;border-radius:12px;padding:16px;margin-top:14px;text-align:right;';

    const sender = document.createElement('strong');
    sender.textContent = letter.name || 'ناشناس';

    const message = document.createElement('p');
    message.style.whiteSpace = 'pre-wrap';
    message.textContent = letter.message || '';

    const date = document.createElement('small');
    date.textContent = letter.created_at
      ? new Date(letter.created_at).toLocaleString('fa-IR')
      : '';

    card.append(sender, message, date);

    if (letter.drawing_data) {
      const drawingTitle = document.createElement('p');
      drawingTitle.textContent = 'نقاشی پیوست‌شده ✧';
      drawingTitle.style.cssText =
        'margin-top:18px;color:#9b716a;font-size:13px;';

      const drawing = document.createElement('img');
      drawing.src = letter.drawing_data;
      drawing.alt = 'نقاشی فرستنده';
      drawing.style.cssText =
        'display:block;max-width:100%;max-height:350px;object-fit:contain;border:1px solid #eadbd4;border-radius:8px;margin-top:8px;background:#fffdf8;';

      card.append(drawingTitle, drawing);
    }

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'حذف نامه';
    deleteButton.style.cssText =
      'display:block;width:100%;margin-top:18px;padding:12px;border:0;border-radius:8px;background:#b9877e;color:white;font-size:15px;cursor:pointer;';

    deleteButton.addEventListener('click', () => {
      deleteLetter(letter.id, deleteButton);
    });

    card.append(deleteButton);
    lettersBox.append(card);
  });
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();

  status.textContent = 'در حال ورود...';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    status.textContent = 'ایمیل یا رمز عبور درست نیست.';
    console.error(error);
    return;
  }

  loginForm.hidden = true;
  logoutButton.hidden = false;

  await loadLetters();
});

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut();

  loginForm.hidden = false;
  logoutButton.hidden = true;
  lettersBox.replaceChildren();

  status.textContent = 'از حساب خارج شدی.';
});

supabase.auth.onAuthStateChange((event, session) => {
  if (session && event === 'SIGNED_IN') {
    loginForm.hidden = true;
    logoutButton.hidden = false;
    loadLetters();
  }
});
