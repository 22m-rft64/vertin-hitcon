const ja = {
  // Language
  'lang.set': '確認した。日本語に切り替えたよ。',

  // Translation feature
  'translate.same': 'もう君の言語だよ。翻訳するものはない。',
  'translate.empty': '翻訳する内容がない。',
  'translate.error': '翻訳できなかった。もう一度やってみる？',
  'translate.cooldown': '{sec}秒後にもう一度。',
  'translate.title': '翻訳',
  'translate.original': '原文',

  // General commands
  'cmd.ping.description': '生きてるか確認する。',
  'cmd.ping.reply': '{ms}ms。まだ問題なさそうだ。',
  'cmd.ping.error': '想定外の結果だ。',
  'cmd.echo.description': 'そのまま伝える。',
  'cmd.echo.option_content': '伝える内容。',
  'cmd.about.description': '自分のことを少し。',
  'cmd.about.title': 'ヴェルティン',
  'cmd.about.body':
    '私は記録する者だ。\n' +
    '時代の始まりと終わりを…そして今は、君たちのチームのCTFも。\n\n' +
    '参加申請、問題の解決、スコアボード。\n' +
    '必要なことは全てここで処理できる。\n\n' +
    '> 何であれ、記録は残しておくといい。\n' +
    '> …後で振り返れるから。',

  'cmd.help.description': '使い方を案内する。',
  'cmd.help.intro_title': 'ヴェルティンだ',
  'cmd.help.intro_body':
    'CTF参加者の協力を助けるボットだ。\n' +
    '参加申請、問題解決、スコアボード…全てここで処理できる。\n\n' +
    '> 初めてでも大丈夫。一つずつ案内する。\n' +
    '> 下のボタンでページをめくれる。',
  'cmd.help.join_title': '1️⃣ CTFに参加する',
  'cmd.help.join_body':
    '新しいCTFが開くと、告知チャンネルに**参加ボタン**が出る。\n' +
    'ボタンを押すとロールが付与され、CTFチャンネルが見えるようになる。\n\n' +
    'コマンドでも可能：\n' +
    '```\n/ctf join ctfname: CTF名\n```\n\n' +
    '参加するとこれらのチャンネルが見える：\n' +
    '- **general** — チームメイトとの交流の場。\n' +
    '- **announcements** — 問題リストが自動整理される。\n' +
    '- **credentials** — 大会サイトの接続情報。`/ctf showcreds`でも確認可能。\n\n' +
    '> 一人じゃない。まず参加から。\n' +
    '> 解けない問題があっても大丈夫。一緒に見れば見えるものがある。',
  'cmd.help.workon_title': '2️⃣ 問題に取り組む',
  'cmd.help.workon_body':
    'CTFチャンネルには**カテゴリ別テキストチャンネル**がある。(web, pwn, crypto...)\n' +
    '各チャンネル内に問題ごとの**スレッド**が一つずつ作られている。\n\n' +
    '解きたい問題があれば、まず参加宣言：\n' +
    '```\n/ctf workon name: 問題名\n```\n' +
    'そのスレッドに自動追加される。中で議論しながら解けばいい。\n\n' +
    '> 💡 `/ctf workon all: True` — 全問題に一括参加\n\n' +
    'announcementsチャンネルの問題リストから**workonボタン**を押してもいい。\n\n' +
    '> 一つだけ。workonして黙っていないで。\n' +
    '> 何を試したか、どこで詰まったかスレッドに残して。\n' +
    '> 君の「ダメだった」メモが、他の人には鍵になるかもしれないから。',
  'cmd.help.solve_title': '3️⃣ 解答を登録する',
  'cmd.help.solve_body':
    '問題を解いたら、そのスレッド内で：\n' +
    '```\n/ctf solve\n```\n' +
    '**Solveパネル**が出て、ここで：\n\n' +
    '1. **Contributors** — 一緒に解いた人を選択\n' +
    '2. **Flag入力** — フラグを記録\n' +
    '3. **Submit** — 提出\n\n' +
    '提出するとスレッドに✅が付き、\n' +
    '**solves**チャンネルに解決通知が出る。\n' +
    '**feed**チャンネルでリアルタイムのアクティビティログも確認できる。\n\n' +
    '> 貢献した人がいればContributorsに必ず入れて。\n' +
    '> ヒント一つ、アイデア一つが決定的だったかもしれないから。\n' +
    '> …記録は正確でなければ。\n\n' +
    '> 間違えたら`/ctf solve`で修正するか、**Unsolve**で戻せる。',
  'cmd.help.profile_title': '4️⃣ 翻訳機能',
  'cmd.help.profile_body':
    'グローバルチームだから翻訳機能があるよ。\n\n' +
    '**メッセージを右クリック → Apps → Translate**\n' +
    'そのメッセージ一つを翻訳する。自分だけに見える。\n\n' +
    '**メッセージを右クリック → Apps → Translate (Context)**\n' +
    '前後5件のメッセージを含めて会話全体を翻訳する。\n\n' +
    '**メッセージを右クリック → Apps → Translate (User)**\n' +
    'その人が連続で送ったメッセージをまとめて翻訳する。分割して送る場合に便利。\n\n' +
    '> 韓国語、英語、日本語、フィンランド語に対応している。\n' +
    '> Discordクライアントの言語設定に従うから、別途設定は不要。',
  'cmd.help.tips_title': '知っておくと良いこと',
  'cmd.help.tips_body':
    '**自分の分野以外の問題にも入ってみて。**\n' +
    'Webだけやってた人がMiscで決定的な発見をすることもある。\n' +
    '知らない分野でもスレッドに入って読むだけで助けになる。\n\n' +
    '**小さなことも共有して。**\n' +
    '「これは違うと思う」も情報だ。試行錯誤の記録がチーム全体の時間を節約する。\n' +
    'CTFは結局チームゲーム。連携する5人が一人でやる1人より強い。\n\n' +
    '**便利なコマンド：**\n' +
    '`/ctf status` — 現在のCTF進行状況\n' +
    '`/ctf showcreds` — 大会接続情報\n\n' +
    '**チャンネル一覧：**\n' +
    '`general` 交流 · `announcements` 問題リスト · `credentials` 接続情報\n' +
    '`solves` 解決通知 · `feed` リアルタイム活動\n\n' +
    '> 分からなければ聞いて。チームメイトが助けてくれる。\n' +
    '> …一緒なら強くなれるのは確かだから。',

  // Error messages (shared)
  'error.unknown_command': '…聞いたことがないな。',
  'error.unknown_subcommand': 'そんな項目はない。',
  'error.no_permission': 'それは君の権限の外だ。',
  'error.unexpected': '想定外のことが起きた。もう一度やってみる？',
  'error.unknown_component': '…認識できない操作だ。',
  'error.fetch_ctf': 'CTF情報を取得できなかった。',
  'error.not_in_ctf_channel': 'CTFチャンネル内で実行して。',
  'error.archived_ctf': 'アーカイブ済みのCTFだ。',
  'error.ctf_not_found': 'そんなCTFはない。',
  'error.challenge_not_found': 'そんな問題はない。',
  'error.ctf_role_not_found': 'CTFロールが見つからない。管理者に確認して。',
  'error.already_joined': 'もう参加してるよ。',

  // CTF join
  'cmd.ctf.join.description': 'CTFに参加する。',
  'cmd.ctf.join.option_ctfname': '参加するCTF名。',
  'cmd.ctf.join.error_private': '非公開のCTFだ。管理者の招待が必要。',
  'cmd.ctf.join.success': '✅ {ctfName}に登録した。',
  'msg.user_joined': '{user}が合流した。',
  'cmd.ctf.join.left': '...{ctfName}から抜けた。もう一度ボタンを押せば戻れる。',
  'msg.feed.participant_joined': '**参加** · {user}が大会に合流した。',
  'msg.feed.participant_left': '**退出** · {user}が大会から抜けた。',

  // CTF workon
  'cmd.ctf.workon.description': '問題スレッドに参加する。',
  'cmd.ctf.workon.option_name': '問題名。大文字小文字は問わない。',
  'cmd.ctf.workon.option_all': '全問題に参加するかどうか。',
  'cmd.ctf.workon.success': '✅ `{name}`に登録した。',
  'cmd.ctf.workon.success_all': '✅ {count}個の問題に登録した。',
  'cmd.ctf.workon.error_tryout': '`tryout`メンバーは解決済みの問題に参加できない。',
  'cmd.ctf.workon.error_add': '参加処理中にエラーが出た。',
  'msg.workon_all': '{user} → 全問題に参加 ({count}個)',

  // CTF solve
  'cmd.ctf.solve.description': '解答を登録する。',
  'cmd.ctf.solve.error_need_thread': '問題スレッド内で実行して。',
  'cmd.ctf.solve.error_permission': 'メインsolverか管理者だけが変更できる。',

  // CTF status
  'cmd.ctf.status.description': 'CTFの進行状況を確認する。',
  'cmd.ctf.status.option_ctfname': 'CTF名。デフォルトは現在のチャンネル。',
  'cmd.ctf.status.option_mode': '全体または未解決のみ表示。',
  'cmd.ctf.status.no_active': '進行中のCTFはない。',
  'cmd.ctf.status.no_challenges': 'まだ登録された問題がない。',

  // CTF scoreboard
  'cmd.ctf.scoreboard.description': 'スコアボードを確認する。',
  'cmd.ctf.scoreboard.unavailable': 'スコアボード機能は現在使えない。クレデンシャルチャンネルで直接確認して。',

  // CTF create challenge
  'cmd.ctf.createchallenge.description': '新しい問題を追加する。',
  'cmd.ctf.createchallenge.option_category': 'カテゴリ。',
  'cmd.ctf.createchallenge.option_name': '名前。空欄ならバッチ作成モーダルが開く。',
  'cmd.ctf.createchallenge.error_exists': '同名の問題がすでにある。',
  'cmd.ctf.createchallenge.success': '✅ 問題`{name}`を作成した。',

  // CTF delete challenge
  'cmd.ctf.deletechallenge.description': '問題を削除する。',
  'cmd.ctf.deletechallenge.option_name': '削除する問題名。デフォルトは現在のスレッド。',
  'cmd.ctf.deletechallenge.error_need_target': '問題スレッドで実行するか、名前を指定して。',
  'cmd.ctf.deletechallenge.error_remove': '削除中にエラーが出た。',
  'cmd.ctf.deletechallenge.success': '✅ 問題`{name}`を削除した。',

  // CTF rename challenge
  'cmd.ctf.renamechallenge.description': '問題名を変更する。',
  'cmd.ctf.renamechallenge.option_new': '新しい名前。',
  'cmd.ctf.renamechallenge.option_old': '対象の問題名。',
  'cmd.ctf.renamechallenge.success': '✅ 問題名を変更した。',

  // CTF addplayers
  'cmd.ctf.addplayers.description': 'メンバーをCTFに直接追加する。',
  'cmd.ctf.addplayers.option_user': '追加するメンバー。',
  'cmd.ctf.addplayers.option_ctfname': 'CTF名。',
  'cmd.ctf.addplayers.error_member_not_found': 'サーバー上で見つからなかった。',
  'cmd.ctf.addplayers.success': '✅ {member}を登録した。',

  // CTF showcreds
  'cmd.ctf.showcreds.description': '接続情報を確認する。',
  'cmd.ctf.showcreds.option_ctfname': 'CTF名。デフォルトは現在のチャンネル。',
  'cmd.ctf.showcreds.error_need_context': 'CTFチャンネルで実行するか、名前を指定して。',

  // CTF assign
  'cmd.ctf.assign.description': '新しいCTFを作成する。',
  'cmd.ctf.assign.embed_title': '新しい記録の始まり',
  'cmd.ctf.assign.embed_description': '手動作成ボタンを押して。',
  'cmd.ctf.assign.footer': '30分後に消える。',
  'button.direct_create': '手動作成',
  'button.join': '参加',
  'button.continue': '続行',
  'button.edit': '編集',
  'button.confirm': 'このまま進める',

  // Config
  'cmd.ctf.config.description': 'CTFの設定を調整する。',
  'config.home_title': 'CTF管理ダッシュボード',
  'config.home_description': 'どこを直す？',
  'config.archived_title': 'アーカイブ済みCTF管理',
  'config.archived_description': 'アーカイブ状態だ。できることは限られる。',
  'config.field_ctf_manage': 'CTF管理',
  'config.field_ctf_manage_value': '名前変更、削除',
  'config.field_player_manage': '参加者管理',
  'config.field_player_manage_value': '追加、削除、ロール変更',
  'config.field_creds_manage': '認証情報管理',
  'config.field_creds_manage_value': '接続情報の設定',
  'config.footer_30m': '30分後に消える。',
  'config.footer_10m': '10分後に消える。',
  'config.menu_placeholder': 'どこを直す？',
  'config.manage_title': 'CTF管理メニュー',
  'config.manage_description': '下のボタンで管理できる。',
  'config.manage_field_rename': 'CTF名変更',
  'config.manage_field_rename_value': 'CTFの名前を変えられる。',
  'config.manage_field_privacy': 'CTF公開設定',
  'config.manage_field_privacy_value': '公開状態を切り替えられる。',
  'config.manage_field_delete': 'CTF削除',
  'config.manage_field_delete_value': '全部消える。元に戻せないから、慎重に。',
  'config.button_rename': 'CTF名変更',
  'config.button_delete': 'CTF削除',
  'config.button_delete_channels': 'チャンネル削除',
  'config.button_privacy': '公開切り替え',
  'config.delete_confirm_title': '本当に削除する？',
  'config.delete_confirm_label': '全て消える。確認のためCTF名を入力して。',
  'config.delete_name_mismatch': '❌ 名前が一致しない。',
  'config.delete_success': '✅ CTF`{name}`を削除した。\n5秒後にこのチャンネルも消える。',
  'config.rename_success': '✅ CTF名を**{name}**に変更した。',
  'config.channels_deleted': '✅ `{name}`のチャンネルを{count}個削除した。DBは残してある。',

  // Solve panel
  'solve.no_contributors': 'なし',
  'solve.no_flag': '未入力',
  'solve.status_submitted': 'Submit済み。変更するなら下のボタンを押して。',
  'solve.placeholder_contributors': '一緒に解いた人を選んで。',
  'solve.button_flag': 'Flag入力',
  'solve.button_change_solver': 'Solver変更',
  'solve.button_save': '変更を保存',
  'solve.button_unsolve': 'Unsolve',
  'solve.button_submit': 'Submit',
  'solve.modal_flag_title': 'Flag入力',
  'solve.modal_flag_placeholder': 'flagを入力して。',
  'solve.select_solver': 'メインで解いた人を選んで。',
  'solve.solver_changed': '✅ Solverを変更した。保存ボタンで反映して。',
  'solve.solved_title': 'Challenge solved!',

  // Batch challenge
  'batch.modal_title': '{category} チャレンジ一括作成',
  'batch.modal_label': '問題名（改行で区切る）',
  'batch.error_no_names': '❌ 問題名を入力する必要がある。',
  'batch.created': '✅ {count}個作成',
  'batch.skipped': '⏭️ {count}個スキップ（既存）',
  'batch.failed': '❌ {count}個失敗',

  // Announce
  'announce.preview_title': 'アナウンスプレビュー',
  'announce.modal_title': 'アナウンス編集',
  'announce.modal_label': 'アナウンス内容',
  'announce.modal_placeholder': 'アナウンス内容を書いて。',
  'announce.sent': '✅ アナウンスを送信した。',

  // Credentials
  'config.creds_title': '認証情報管理メニュー',
  'config.creds_no_creds': '認証情報がまだない。',
  'config.creds_field_existing': '既存アカウント情報の登録',
  'config.creds_field_existing_value': '既に作成したアカウント情報で登録できる。',
  'config.creds_field_new': '新規アカウント情報の登録',
  'config.creds_field_new_value': 'アカウント情報を新しく登録できる。',
  'config.creds_need_url': '先にURLを登録する必要がある。',
  'config.button_add_url': 'CTF URL登録',
  'config.url_format_error': '⚠️ URLの形式が正しくない。もう一度入力して。',
  'config.url_registered': '✅ URLを登録した。',
  'credentials.added': '✅ Credentials added.',

  // Events
  'event.ctf_started': '{role} CTFが始まった。各自持ち場へ。',
  'event.ctf_ended': '{role} CTFが終わった。お疲れ。',
  'event.ctf_ended_thread': 'CTFが終わった。',

  // Activity feed
  'feed.worker_join': '{user} → {category}/{name} 参加',
  'feed.worker_idle': '💤 {user} → {category}/{name} 一時離脱',
  'feed.solve': '✅ {solvers} → {category}/{name} 解決',
  'feed.unsolve': '{category}/{name} — 解決取り消し',

  // Workon button
  'button.workon_unsolved': 'この問題、見てみる。',
  'button.workon_solved': '終わった案件だけど…見たければどうぞ。',
  'reply.joined_challenge': '✅ `{name}`に参加した。',
  'msg.user_joined_thread': '{user}が参加した。',

  // Challenge embed
  'challenge.click_to_participate': '参加するなら下のボタンを押して。',
  'challenge.workers_count': '{count}人参加中',
  'challenge.no_challenges': 'No challenges yet.',
  'challenge.solved_count': '{solved}/{total} solved',

  // Settings
  'config.settings_title': 'CTF設定',
  'config.settings_description': '下のボタンで設定を変えられる。',
  'config.settings_not_set': '未設定',
  'config.settings_field_flag': 'Flag形式',
  'config.settings_field_event_id': 'Event ID',
  'config.settings_field_start': '開始時刻',
  'config.settings_field_end': '終了時刻',
  'config.flag_format_success': '✅ Flag形式を`{value}`に変更した。',
  'config.schedule_success': '✅ 時刻を変更した。',
  'config.event_id_success': '✅ Event IDを`{value}`に変更した。',
  'config.button_sync': 'チャンネル同期',
  'config.sync_success': 'チャンネル同期完了。',

  // Player manage
  'config.player_title': '参加者管理メニュー',
  'config.player_field_role': 'CTFロール変更',
  'config.player_field_role_value': '現在のCTFに割り当てられたロールを変えられる。',
  'config.button_change_role': 'CTFロール変更',
  'config.select_role': 'ロールを選んで。',
  'config.role_changed': '✅ CTF **{name}**のロールを{role}に変更した。',

  // Config - privacy
  'config.privacy_current': '現在の状態: __**{status}**__。\n**{opposite}**に切り替える？',
  'config.privacy_public': '公開',
  'config.privacy_private': '非公開',
  'config.privacy_toggle_button': '切り替え',
  'config.privacy_error': '❌ 公開設定の変更中にエラーが発生した: {error}',
  'config.privacy_changed': '✅ {name}の公開設定を__**{status}**__に変更した',

  // Config - back / session
  'config.back_button': '戻る',
  'config.session_expired': '❌ セッションが期限切れ。/ctf configを再実行して。',

  // Config - rename modal
  'config.rename_modal_title': 'CTF名変更 (現在: {name})',
  'config.rename_modal_label': '新しいCTF名',
  'config.rename_error': '❌ 名前変更中にエラーが発生した: {error}',
  'config.rename_discord_warning': '⚠️ **{name}**に変更したが、一部のDiscord反映に失敗した:\n{failures}\n\n手動で確認して。',

  // Config - delete channels
  'config.deleting_channels': 'チャンネル削除中...',
  'config.delete_channels_partial': '❌ 一部のチャンネルを削除できなかった{details}',
  'config.delete_with_failures': '⚠️ CTF`{name}`を削除した。以下のチャンネルは手動で削除して:\n{channels}\n\n5秒後にこのチャンネルも消える。',

  // Config - settings modals
  'config.settings_flag_button': 'Flag形式',
  'config.settings_flag_modal_title': 'Flag形式設定',
  'config.settings_flag_modal_label': 'Flag形式（例: codegate{}, FLAG{}, flag{}）',
  'config.settings_flag_error': '❌ Flag形式の変更中にエラーが発生した: {error}',
  'config.settings_schedule_button': '開始/終了時刻',
  'config.settings_schedule_modal_title': '開始/終了時刻変更',
  'config.settings_start_label': '開始時刻 (YYYY-MM-DDTHH:MM, KST)',
  'config.settings_end_label': '終了時刻 (YYYY-MM-DDTHH:MM, KST)',
  'config.settings_start_error': '❌ 開始時刻の形式が正しくない。(YYYY-MM-DDTHH:MM)',
  'config.settings_end_error': '❌ 終了時刻の形式が正しくない。(YYYY-MM-DDTHH:MM)',
  'config.settings_no_changes': '⚠️ 変更する時刻が入力されていない。',
  'config.settings_schedule_error': '❌ 時刻の変更中にエラーが発生した: {error}',
  'config.settings_event_id_button': 'Event ID',
  'config.settings_event_id_modal_title': 'CTFTime Event ID変更',
  'config.settings_event_id_label': 'CTFTime Event ID（例: hack-lu-ctf-2025）',
  'config.settings_event_id_error': '❌ Event IDの変更中にエラーが発生した: {error}',
  'config.settings_sync_button': 'チャンネル同期',
  'config.settings_sync_error': '❌ 同期中にエラーが発生した: {error}',
  'config.settings_sync_complete': '**チャンネル同期完了。**\nカテゴリ: <#{categoryId}>\n\n{results}',
  'config.settings_sync_category_error': '❌ カテゴリチャンネルが見つからなかった。',
  'config.settings_sync_created': '（新規作成）',
  'config.settings_sync_create_failed': '作成失敗',

  // Config - credentials URL modal
  'config.creds_url_modal_title': 'CTF URL登録',
  'config.creds_url_label': 'CTF URL',
  'config.creds_url_error': '⚠️ URL登録中にエラーが発生した: {error}',

  // Config - select menu labels
  'config.menu_ctf_manage': 'CTF管理',
  'config.menu_ctf_manage_desc': '名前変更、削除、アーカイブ',
  'config.menu_player_manage': '参加者管理',
  'config.menu_player_manage_desc': '追加、削除',
  'config.menu_creds_manage': '認証情報管理',
  'config.menu_creds_manage_desc': 'プラットフォーム連携、ログイン設定',
  'config.menu_ctf_settings': 'CTF設定',
  'config.menu_ctf_settings_desc': 'Flag形式、時刻、Event ID',

  // Config - player manage select
  'config.select_role_placeholder': 'ロールを選択して。',
  'config.role_select_error': '❌ ロールを選択する必要がある。',
  'config.role_migration_failed': '⚠️ {count}人のロール移行に失敗: {names}',
  'config.role_delete_failed': '⚠️ 以前のロールの削除に失敗した。手動で削除して。',
  'config.role_error': '❌ ロール処理中にエラーが発生した。',
  'config.role_update_error': '❌ ロール変更中にエラーが発生した: {error}',

  // Workon - additional messages
  'error.already_working': '⚠️ 既に取り組み中。',
  'error.already_idle': '⚠️ 既に休憩中。',
  'error.not_working': '⚠️ この問題に取り組んでいない。',
  'error.tryout_solved': '⚠️ `tryout`メンバーは解決済みの問題に参加できない。',
  'error.ctf_not_found_short': '❌ CTFが見つからなかった。',
  'msg.user_joined_thread_content': '{user}が参加した。',
  'reply.reactivated_challenge': '✅ `{name}`に復帰した。',
  'reply.deactivated_challenge': '💤 `{name}`から一時離脱。',

  // Solve - additional messages
  'solve.error_ctf_not_found': '❌ CTFが見つからなかった。',
  'solve.error_challenge_not_found': '❌ 問題が見つからなかった。',
  'solve.select_solver_prompt': 'メインで解いた人を選んで。',

  // Batch - additional messages
  'batch.error_server': '❌ サーバー情報を取得できなかった。',

  // CTF refreshthreads
  'cmd.ctf.refreshthreads.description': '全チャレンジスレッドを全員に表示する。',
  'cmd.ctf.refreshthreads.success': '✅ {refreshed}個のスレッドを更新。{failed}個失敗。',


  // CTF pull
  'cmd.ctf.pull.description': 'プラットフォームから問題とスコアボードを取得する。',
  'cmd.ctf.pull.no_cookie': 'セッションCookieが設定されていない。クレデンシャルのTokenフィールドに追加して。',
  'cmd.ctf.pull.result_title': 'Pull結果',
  'cmd.ctf.pull.created': '作成済み',
  'cmd.ctf.pull.skipped': 'スキップ',
  'cmd.ctf.pull.errors': 'エラー',
  'cmd.ctf.pull.challenges_section': '問題',
  'cmd.ctf.pull.scoreboard_section': 'スコアボード',
  'cmd.ctf.pull.teams_count': 'チーム数',
  'cmd.ctf.pull.my_team': '自チーム',
  'cmd.ctf.pull.new_challenges_feed': '新しい問題を取得',
  'cmd.ctf.pull.autopull_started': '...自動ポーリング有効。2分ごと。',
  'cmd.ctf.pull.autopull_stopped': '自動ポーリング停止。',
  'cmd.ctf.pullignore.added': '`{name}` を無視リストに追加した。',
  'cmd.ctf.pullignore.removed': '`{name}` を無視リストから削除した。',
  'cmd.ctf.pullignore.not_found': '`{name}` は無視リストにない。',
  'cmd.ctf.pullignore.already': '`{name}` はすでに無視リストにある。',
  'cmd.ctf.pullignore.list_title': 'Pull無視リスト',
  'cmd.ctf.pullignore.list_empty': '無視リストは空。',

  // Scoreboard
  'cmd.ctf.scoreboard.title': 'スコアボード',
  'cmd.ctf.scoreboard.my_team': '自チーム',


  // Credentials form
  'credentials.error_fetch': '❌ CTF情報の取得中にエラーが発生した。',
} as const;

export default ja;
