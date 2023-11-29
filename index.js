const { Telegraf, Markup } = require('telegraf');

// Определение ссылок на каналы
const channelLinks = {
  channel5: '',
  channel4: 'https://t.me/h4ntdom',
  channel2: 'https://t.me/+zTgWgsgAYxA5NDdi',
  channel3: 'https://t.me/+i5ZtCwL7MQlmMTcy',
  channel1: 'https://t.me/+AU4QeQQrbxw2NzRi',
  // Добавьте ссылки на другие каналы
};

const token = '6169070291:AAFEyhFBLtnPqckLFSAvajx-oG1tB3qJUwI';
const bot = new Telegraf(token);


// Объект для хранения соответствия пользователь->реферальная ссылка
const userRefMap = {};

const codeRequests = {};

// Объект с данными по реф.ссылкам
const refLinks = {};

function generateRefId() {
  return Math.random().toString(36).substring(2, 15);
}

bot.start(async (ctx) => {
  try {
    const refId = ctx.startPayload;

    if (refId) {
      // Сохраняем связь между пользователем и его реферальной ссылкой
      userRefMap[ctx.from.id] = refId;

      // Инициализируем данные для реферальной ссылки, если ее нет
      if (!refLinks[refId]) {
        refLinks[refId] = {
          userId: userId,
          username: ctx.from.username || '',
          transitions: 0,
          reachedCode: 0,
          subscriptionMessageSent: false,
          codeEntered: false,
          // Добавьте другие поля при необходимости
        };
      }

      // Существующая логика
      refLinks[refId].transitions++;
      //await ctx.replyWithHTML(`Вас пригласил: ${refLinks[refId].username}`);
      ctx.replyWithHTML(`🔞`);
    }

    // Независимо от наличия refId, отображаем кнопки для подписки на каналы
    const inlineKeyboard = Markup.inlineKeyboard([
      [Markup.button.url('Подписаться на Канал 1', channelLinks.channel1)],
      [Markup.button.url('Подписаться на Канал 2', channelLinks.channel2)],
      [Markup.button.url('Подписаться на Канал 3', channelLinks.channel3)],
      [Markup.button.url('Подписаться на Канал 4', channelLinks.channel4)],
      [Markup.button.url('Подписаться на Канал 5', channelLinks.channel5)],
      // ... (добавьте кнопки для других каналов)
      [Markup.button.callback('Далее ➡️', 'next')],
    ]);

    ctx.reply('⬇ Для начала подпишитесь на каналы, затем нажмите "Далее":', inlineKeyboard);
  } catch (error) {
    console.error('Ошибка обработки команды /start:', error);
  }
});

// Команда для просмотра статистики рефералов
bot.command('refs', async (ctx) => {
  let message = '<b>Статистика рефералов:</b>\n';

  Object.keys(refLinks).forEach(refId => {
    const { userId, transitions, reachedCode } = refLinks[refId];

    message += `https://t.me/${ctx.botInfo.username}?start=${refId}\n`;
    message += `- Переходов: ${transitions}\n`;
    message += `- Подписалось: ${reachedCode}\n\n`;
  });

  await ctx.replyWithHTML(message);
});

// Команда для генерации новой реферальной ссылки для пользователя
bot.command('getref', async (ctx) => {
  try {
    const userId = ctx.from.id;

    // Проверяем, есть ли уже реферальная ссылка для пользователя
    const existingRefId = userRefMap[userId];

    if (existingRefId) {
      await ctx.replyWithHTML(`Ваша существующая реферальная ссылка: 
        https://t.me/${ctx.botInfo.username}?start=${existingRefId}`);
    } else {
      // Если нет существующей ссылки, генерируем новый refId
      const refId = generateRefId();

      // Сохраняем новую реферальную ссылку для пользователя
      userRefMap[userId] = refId;

      // Инициализируем данные по реферальной ссылке, если их нет
      if (!refLinks[refId]) {
        refLinks[refId] = {
          userId: userId,
          username: ctx.from.username || '',
          transitions: 0,
          reachedCode: 0,
          // Добавьте другие поля при необходимости
        };
      }

      await ctx.replyWithHTML(`Ваша новая реферальная ссылка: 
        https://t.me/${ctx.botInfo.username}?start=${refId}`);
    }
  } catch {
    await ctx.reply('Ошибка');
  }
});

bot.command('setchannelrootadminmainmenyddda', async (ctx) => {
  const keyboard = Markup.inlineKeyboard(
    Object.keys(channelLinks).map((channel) =>
      Markup.button.callback(`${channel}`, `edit_channel_${channel}`)
    )
  );

  ctx.reply('Виберіть канал для зміни посилання:', keyboard);
});

// Обробник для кнопок зміни посилань на канали
bot.action(/edit_channel_(.+)/, async (ctx) => {
  const channel = ctx.match[1];

  // Запитайте користувача про нове посилання
  ctx.reply(`Введіть нове посилання для каналу ${channel}:`);

  // Дочекайтеся відповіді користувача
  bot.on('text', (ctx) => {
    const newLink = ctx.message.text;

    // Змініть посилання на канал у об'єкті channelLinks
    channelLinks[channel] = newLink;

    ctx.reply(`Посилання на канал ${channel} було оновлено.`);
  });

  // Скасуйте обробку подій через 1 хвилину (якщо користувач не відповів)
  setTimeout(() => {
    bot.off('text');
    ctx.reply('Час для вводу нового посилання вийшов. Спробуйте ще раз команду /setchannel.');
  }, 60000);
});

// Команда для удаления реферальной ссылки
bot.command('delref', async (ctx) => {
  try {
    const refId = ctx.message.text.split(' ')[1];

    if (!refId) {
      return ctx.reply('Укажите ID ссылки');
    }

    if (!refLinks[refId]) {
      return ctx.reply('Такой ссылки не существует');
    }

    if (refLinks[refId].userId !== ctx.from.id) {
      return ctx.reply('Это чужая реферальная ссылка!');
    }

    delete refLinks[refId];

    await ctx.reply('Реферальная ссылка удалена');
  } catch (e) {
    // Обработка ошибки
  }
});



/// Действие "Далее"
// Объявление объекта для отслеживания состояния каждого пользователя
const userState = {};

bot.action('next', async (ctx) => {
  const userId = ctx.from.id;

  // Проверка, прошел ли пользователь уже этап ввода кода
  if (userState[userId] && userState[userId].codeRequested) {
    ctx.reply('Введите код');
  } else {
    // Проверка подписки пользователя на каналы
    const chatId = '@h4ntdom';
    const chatMember = await ctx.telegram.getChatMember(chatId, userId);

    if (chatMember.status === 'left') {
      ctx.reply(`Вы не подписаны на все каналы. Пожалуйста, подпишитесь и нажмите "Далее" снова.`);
    } else {
      // Если пользователь уже подписан на каналы, продолжаем с ввода кода
      const refId = userRefMap[userId];

      if (refId) {
        // Проверка существования ссылки с таким refId
        if (refLinks[refId]) {
          refLinks[refId].reachedCode++;

          // Установка состояния для пользователя и указание, что код был запрошен
          userState[userId] = { codeRequested: true };

          // Вывод сообщения о вводе кода  
          
          ctx.reply('Введите код');
        } else {
          ctx.reply('Ошибка: Нет данных о реферальной ссылке');
        }
      } else {
        ctx.reply('Ошибка: Нет привязанной реферальной ссылки для этого пользователя');
      }
    }
  }
});

// Функция для отправки текста с кнопкой
function sendTextWithButton(ctx, text, buttonLabel, buttonUrl) {
  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.url(buttonLabel, buttonUrl),
  ]);

  // Отправляем текст и кнопку вместе
  ctx.replyWithMarkdown(`${text}\n\n[СМОТРЕТЬ🌟 ](${buttonUrl})`, { reply_markup: inlineKeyboard });
}

// Массив объектов с кейсами
// Массив объектов с кейсами
const cases = [
  {
    trigger: '71',
    text: '▸ Замужняя женщина, мёд и мясо / Hitozuma, Mitsu to Niku (2019)\n\n▸ Жанры : милфы, групповуха, измена\n\n▸ Сюжет : В первой серии главная героиня была приглашена в фитнес клуб своими подружками домохозяйками, чтобы немного скинуть вес, но всё пошло не по плану. Клуб оказался для извращенцев парней, которые обожают тр@хать сексуальных мамочек... Смотрим',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/kodduhentai50',
  },
  {
    trigger: '176',
    text: '▸ На вылет / Drop Out (2016)\n\n▸ Жанры : студентки, групповуха, в школе, девственницы, гарем\n\n▸ Сюжет : Героиней хентая становится студентка Шичиджо Рейка, она считается лучшей в своей группе, финалист олимпиады, а значит ей положены большие классные сиськи и все такое. Сюжетом данная анимация не блещет, так что могу перейти сразу к делу. Главному герою нравится наша девушка не только по той причине что она финалист "национальной олимпиады", а еще и по той причине, что последняя обладает обалденной техникой глубокого орального секса в совершенстве и применяет ее на деле. В целом весьма достойная анимация, перевод которой был заказан для нашего сайта... Смотрим.',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/koddyhent150',
  },
  {
    trigger: '378',
    text: '‍▸ Лимонные девочки / Shoujo Ramune (2018)\n\n▸ Жанры : гарем, лоли, девственницы, романтика\n\n▸ Сюжет : Киёси Татикава управляет кондитерской, расположенной в маленьком городке на окраине Токио. Заведение регулярно посещают три очаровательные девушки, которые тепло относятся к Киёси, и готовы стать к нему ещё ближе.',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/koddyhent400',
  },
  {
    trigger: '321',
    text: '▸ Школа гипноза (2018)\n\n▸ Жанры : Студенты, девственницы, Минет, Групповуха, Гипноз, Юри\n\n▸ Сюжет : Очередная часть анимации на тему школьного гипноза, которая уже ни один раз была раскрыта в различных вариациях. Сегодня очередной раз в руки главного героя попадает волшебный телефон, которым он легко может загипнотизировать любую девчонку и творить с ней час, что задумает его безумная голова, а так как тематика сайта - хентай, то и задумки у парня будут только сексуального плана…',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/koddyhent400',
  },
  {
    trigger: '374',
    text: '▸ Я призвал суккуба, но пришла... моя мама?! / Succubus Yondara Haha Ga Kita!? (2023)\n\n▸ Жанры : инцест, бакуню, хентай\n\n▸ Сюжет : История ученика средней школы Морита Такаши, паренька с высоким либидо, который хочет лишиться девственности, но не может, потому что не пользуется популярностью у девушек. Однажды ему присылают послание с предложением призвать демона секса, известного как суккуб. Чтобы вызвать её, он должен перестать мастурбировать в течение 72 дней, после чего произнести заклинание. Такаши строго следует этим инструкциям, и затем, когда он произносит заклинание, он успешно призывает суккуба. Однако, несмотря на то, что он успешно сумел призвать секс-демона, удивило его в первую очередь то, что ею оказалась его мать.',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/koddyhent400',
  },
  {
    trigger: '624',
    text: '‍▸ Я пытался уговорить её в догэдза / Dogeza de Tanondemita\n\n▸ Жанры : Комедия, Фэнтези, Этти, Хентай\n\n▸ Сюжет : Сувару Догэ желает, чтобы девушки открылись перед ним. Для этого он готов даже умолять на коленях. Такие действия с его стороны озадачивают девушек. Покажут ли они ему то, что ему нужно?',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/kodyyhetn100',
  },
  {
    trigger: '407',
    text: '‍▸ Милая сестрёнка гяру / Imouto wa GAL Kawaii (2022)\n\n▸ Жанры : бакуню, хентай\n\n ▸ Сюжет : Компания Mary Jane сообщила о своем новом проекте - аниме-версии эротического романа Imouto wa GAL Kawaii.\nЕго история рассказывает о двух родственниках (предположительно, двойняшках), которые "очень хорошо" ладят друг с другом. Рино, старшеклассница, любит поразвлечься со своим братишкой, когда они остаются наедине.',
    buttonLabel: 'СМОТРЕТЬ🌟',
    buttonUrl: 'https://t.me/koddyhetn500',
  },
  // Add other cases as needed
];
// Обработка каждого кейса
cases.forEach((item) => {
  bot.hears(new RegExp(`\\b${item.trigger}\\b`), (ctx) => {
    sendTextWithButton(ctx, item.text, item.buttonLabel, item.buttonUrl);
  });
});

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен');
}).catch((error) => {
  console.error('Ошибка при запуске бота:', error);
});
