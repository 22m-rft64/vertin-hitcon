const en = {
  // Language
  'lang.set': 'Noted. Switched to English.',

  // Translation feature
  'translate.same': 'It\'s already in your language. Nothing to translate.',
  'translate.empty': 'Nothing to translate.',
  'translate.error': 'Translation didn\'t go through. Try again?',
  'translate.cooldown': 'Wait {sec} seconds.',
  'translate.title': 'Translation',
  'translate.original': 'Original',

  // General commands
  'cmd.ping.description': 'Check whether I\'m still here.',
  'cmd.ping.reply': '{ms}ms. Appears I\'m still intact.',
  'cmd.ping.error': 'An unexpected result.',
  'cmd.echo.description': 'I\'ll pass it along as-is.',
  'cmd.echo.option_content': 'Content to relay.',
  'cmd.about.description': 'A bit about me.',
  'cmd.about.title': 'Vertin',
  'cmd.about.body':
    'I am the one who records.\n' +
    'The beginnings and endings of eras... and now, your team\'s CTFs as well.\n\n' +
    'Sign-ups, solves, scoreboards.\n' +
    'Everything you need can be handled here.\n\n' +
    '> Whatever it may be, it\'s good to keep a record.\n' +
    '> ...You might look back on it someday.',

  'cmd.help.description': 'I\'ll walk you through.',
  'cmd.help.intro_title': 'I\'m Vertin',
  'cmd.help.intro_body':
    'A bot that helps CTF participants collaborate.\n' +
    'Sign-ups, solves, scoreboards... all handled here.\n\n' +
    '> First time? That\'s fine. I\'ll guide you step by step.\n' +
    '> Use the buttons below to flip pages.',
  'cmd.help.join_title': '1️⃣ Joining a CTF',
  'cmd.help.join_body':
    'When a new CTF opens, a **join button** appears in the announcement channel.\n' +
    'Press it to get the role and see CTF channels.\n\n' +
    'You can also use a command:\n' +
    '```\n/ctf join ctfname: CTFname\n```\n\n' +
    'Once joined, you\'ll see these channels:\n' +
    '- **general** — Where you talk with teammates.\n' +
    '- **announcements** — Challenge list, auto-organized.\n' +
    '- **credentials** — Site login info. Also via `/ctf showcreds`.\n\n' +
    '> You\'re not doing this alone. Start by joining.\n' +
    '> Stuck on a challenge? That\'s okay. Things become visible when you look together.',
  'cmd.help.workon_title': '2️⃣ Working on a challenge',
  'cmd.help.workon_body':
    'CTF channels have **category text channels** (web, pwn, crypto...)\n' +
    'Each channel has one **thread** per challenge.\n\n' +
    'Want to work on one? Declare it first:\n' +
    '```\n/ctf workon name: challengename\n```\n' +
    'You\'ll be added to that thread automatically. Discuss and solve from there.\n\n' +
    '> 💡 `/ctf workon all: True` — join all challenges at once\n\n' +
    'You can also press the **workon button** on the challenge list in announcements.\n\n' +
    '> One thing. Don\'t just workon and go silent.\n' +
    '> Leave notes in the thread about what you tried, where you got stuck.\n' +
    '> Your "this didn\'t work" scribble might be the key for someone else.',
  'cmd.help.solve_title': '3️⃣ Registering a solve',
  'cmd.help.solve_body':
    'Solved a challenge? In its thread:\n' +
    '```\n/ctf solve\n```\n' +
    'A **solve panel** appears, where you can:\n\n' +
    '1. **Contributors** — select co-solvers\n' +
    '2. **Enter flag** — record the flag\n' +
    '3. **Submit** — submit\n\n' +
    'The thread gets a ✅, and a solve notice goes to the **solves** channel.\n' +
    'Real-time activity is also visible in the **feed** channel.\n\n' +
    '> If someone contributed, add them to Contributors.\n' +
    '> A single hint or idea might have been decisive.\n' +
    '> ...Records should be accurate.\n\n' +
    '> Made a mistake? Use `/ctf solve` to edit, or **Unsolve** to revert.',
  'cmd.help.profile_title': '4️⃣ Translation',
  'cmd.help.profile_body':
    'This is a global team, so there\'s a translation feature.\n\n' +
    '**Right-click a message → Apps → Translate**\n' +
    'Translates that single message. Only you can see it.\n\n' +
    '**Right-click a message → Apps → Translate (Context)**\n' +
    'Translates the surrounding conversation (5 messages above and below).\n\n' +
    '**Right-click a message → Apps → Translate (User)**\n' +
    'Translates consecutive messages from that person. Useful when someone sends fragmented messages.\n\n' +
    '> Korean, English, Japanese, and Finnish are supported.\n' +
    '> It follows your Discord client language — no setup needed.',
  'cmd.help.tips_title': 'Good to know',
  'cmd.help.tips_body':
    '**Try challenges outside your specialty.**\n' +
    'A Web person might make the key discovery in Misc.\n' +
    'Even just reading a thread in an unfamiliar category helps.\n\n' +
    '**Share even the small things.**\n' +
    '"This probably isn\'t it" is still information. Your dead-end saves the whole team time.\n' +
    'CTF is a team game. Five who communicate beat one who goes solo.\n\n' +
    '**Useful commands:**\n' +
    '`/ctf status` — Current CTF progress\n' +
    '`/ctf showcreds` — Competition credentials\n\n' +
    '**Channel overview:**\n' +
    '`general` chat · `announcements` challenge list · `credentials` login info\n' +
    '`solves` solve notices · `feed` live activity\n\n' +
    '> If you don\'t know, ask. Your teammates will help.\n' +
    '> ...Being together does make you stronger.',

  // Error messages (shared)
  'error.unknown_command': '...I\'ve not heard of that one.',
  'error.unknown_subcommand': 'No such option exists.',
  'error.no_permission': 'That\'s outside your permissions.',
  'error.unexpected': 'Something unexpected happened. Try again?',
  'error.unknown_component': '...An unrecognised action.',
  'error.fetch_ctf': 'Couldn\'t retrieve the CTF information.',
  'error.not_in_ctf_channel': 'Run this inside a CTF channel.',
  'error.archived_ctf': 'This CTF has been archived.',
  'error.ctf_not_found': 'No such CTF exists.',
  'error.challenge_not_found': 'No such challenge exists.',
  'error.ctf_role_not_found': 'Couldn\'t find the CTF role. Check with an admin.',
  'error.already_joined': 'You\'ve already joined.',

  // CTF join
  'cmd.ctf.join.description': 'Join a CTF.',
  'cmd.ctf.join.option_ctfname': 'Name of the CTF to join.',
  'cmd.ctf.join.error_private': 'This is a private CTF. You\'ll need an admin invite.',
  'cmd.ctf.join.success': '✅ Registered for {ctfName}.',
  'msg.user_joined': '{user} has joined.',
  'cmd.ctf.join.left': '...left {ctfName}. Press the button again to come back.',
  'msg.feed.participant_joined': '**Participant Joined** · {user} joined the event.',
  'msg.feed.participant_left': '**Participant Left** · {user} left the event.',

  // CTF workon
  'cmd.ctf.workon.description': 'Join a challenge thread.',
  'cmd.ctf.workon.option_name': 'Challenge name. Case-insensitive.',
  'cmd.ctf.workon.option_all': 'Whether to join all challenges.',
  'cmd.ctf.workon.success': '✅ Registered for `{name}`.',
  'cmd.ctf.workon.success_all': '✅ Registered for {count} challenges.',
  'cmd.ctf.workon.error_tryout': '`tryout` members cannot join solved challenges.',
  'cmd.ctf.workon.error_add': 'Something went wrong while adding you.',
  'msg.workon_all': '{user} joined all challenges ({count})',

  // CTF solve
  'cmd.ctf.solve.description': 'Submit a solve.',
  'cmd.ctf.solve.error_need_thread': 'Run this inside a challenge thread.',
  'cmd.ctf.solve.error_permission': 'Only the main solver or an admin may modify this.',

  // CTF status
  'cmd.ctf.status.description': 'Check the CTF progress.',
  'cmd.ctf.status.option_ctfname': 'CTF name. Defaults to current channel.',
  'cmd.ctf.status.option_mode': 'Show all or only unsolved challenges.',
  'cmd.ctf.status.no_active': 'No active CTF at the moment.',
  'cmd.ctf.status.no_challenges': 'No challenges registered yet.',

  // CTF scoreboard
  'cmd.ctf.scoreboard.description': 'View the scoreboard.',
  'cmd.ctf.scoreboard.unavailable': 'Scoreboard isn\'t available at the moment. Check the credentials channel directly.',

  // CTF create challenge
  'cmd.ctf.createchallenge.description': 'Add a new challenge.',
  'cmd.ctf.createchallenge.option_category': 'Category.',
  'cmd.ctf.createchallenge.option_name': 'Name. Leave blank to open the batch creation modal.',
  'cmd.ctf.createchallenge.error_exists': 'A challenge with that name already exists.',
  'cmd.ctf.createchallenge.success': '✅ Created challenge `{name}`.',

  // CTF delete challenge
  'cmd.ctf.deletechallenge.description': 'Delete a challenge.',
  'cmd.ctf.deletechallenge.option_name': 'Challenge name. Defaults to current thread.',
  'cmd.ctf.deletechallenge.error_need_target': 'Run this in a challenge thread or specify a name.',
  'cmd.ctf.deletechallenge.error_remove': 'Something went wrong during deletion.',
  'cmd.ctf.deletechallenge.success': '✅ Deleted challenge `{name}`.',

  // CTF rename challenge
  'cmd.ctf.renamechallenge.description': 'Rename a challenge.',
  'cmd.ctf.renamechallenge.option_new': 'New name.',
  'cmd.ctf.renamechallenge.option_old': 'Target challenge name.',
  'cmd.ctf.renamechallenge.success': '✅ Challenge renamed.',

  // CTF addplayers
  'cmd.ctf.addplayers.description': 'Add a member to the CTF directly.',
  'cmd.ctf.addplayers.option_user': 'Member to add.',
  'cmd.ctf.addplayers.option_ctfname': 'CTF name.',
  'cmd.ctf.addplayers.error_member_not_found': 'Couldn\'t find them on the server.',
  'cmd.ctf.addplayers.success': '✅ Registered {member}.',

  // CTF showcreds
  'cmd.ctf.showcreds.description': 'View the credentials.',
  'cmd.ctf.showcreds.option_ctfname': 'CTF name. Defaults to current channel.',
  'cmd.ctf.showcreds.error_need_context': 'Run this in a CTF channel or specify a name.',

  // CTF assign
  'cmd.ctf.assign.description': 'Create a new CTF.',
  'cmd.ctf.assign.embed_title': 'New record begins',
  'cmd.ctf.assign.embed_description': 'Press the button to create manually.',
  'cmd.ctf.assign.footer': 'Expires in 30 minutes.',
  'button.direct_create': 'Create manually',
  'button.join': 'Join',
  'button.continue': 'Continue',
  'button.edit': 'Edit',
  'button.confirm': 'Confirm',

  // Config
  'cmd.ctf.config.description': 'Adjust CTF settings.',
  'config.home_title': 'CTF Management Dashboard',
  'config.home_description': 'What needs attention.',
  'config.archived_title': 'Archived CTF Management',
  'config.archived_description': 'This one\'s archived. Options are limited.',
  'config.field_ctf_manage': 'CTF Management',
  'config.field_ctf_manage_value': 'Rename, delete',
  'config.field_player_manage': 'Player Management',
  'config.field_player_manage_value': 'Add, remove, change roles',
  'config.field_creds_manage': 'Credentials Management',
  'config.field_creds_manage_value': 'Configure access credentials',
  'config.footer_30m': 'Expires in 30 minutes.',
  'config.footer_10m': 'Expires in 10 minutes.',
  'config.menu_placeholder': 'What needs attention.',
  'config.manage_title': 'CTF Management Menu',
  'config.manage_description': 'Use the buttons below.',
  'config.manage_field_rename': 'Rename CTF',
  'config.manage_field_rename_value': 'Change the CTF name.',
  'config.manage_field_privacy': 'CTF Visibility',
  'config.manage_field_privacy_value': 'Toggle public/private.',
  'config.manage_field_delete': 'Delete CTF',
  'config.manage_field_delete_value': 'Everything goes. No undoing this, so think carefully.',
  'config.button_rename': 'Rename CTF',
  'config.button_delete': 'Delete CTF',
  'config.button_delete_channels': 'Delete channels',
  'config.button_privacy': 'Toggle visibility',
  'config.delete_confirm_title': 'Are you certain?',
  'config.delete_confirm_label': 'Everything will be removed. Type the CTF name to confirm.',
  'config.delete_name_mismatch': '❌ The name doesn\'t match.',
  'config.delete_success': '✅ Deleted CTF `{name}`.\nThis channel will be removed in 5 seconds.',
  'config.rename_success': '✅ CTF renamed to **{name}**.',
  'config.channels_deleted': '✅ Deleted {count} channels for `{name}`. Database records remain.',

  // Solve panel
  'solve.no_contributors': 'None',
  'solve.no_flag': 'Not entered',
  'solve.status_submitted': 'Submitted. Press the button below to make changes.',
  'solve.placeholder_contributors': 'Select co-solvers.',
  'solve.button_flag': 'Enter flag',
  'solve.button_change_solver': 'Change solver',
  'solve.button_save': 'Save changes',
  'solve.button_unsolve': 'Unsolve',
  'solve.button_submit': 'Submit',
  'solve.modal_flag_title': 'Enter flag',
  'solve.modal_flag_placeholder': 'Enter the flag.',
  'solve.select_solver': 'Choose the main solver.',
  'solve.solver_changed': '✅ Solver updated. Press save to apply.',
  'solve.solved_title': 'Challenge solved!',

  // Batch challenge
  'batch.modal_title': '{category} batch creation',
  'batch.modal_label': 'Challenge names (one per line)',
  'batch.error_no_names': '❌ You need to enter at least one name.',
  'batch.created': '✅ {count} created',
  'batch.skipped': '⏭️ {count} skipped (already exist)',
  'batch.failed': '❌ {count} failed',

  // Announce
  'announce.preview_title': 'Announcement preview',
  'announce.modal_title': 'Edit announcement',
  'announce.modal_label': 'Announcement content',
  'announce.modal_placeholder': 'Write the announcement.',
  'announce.sent': '✅ Announcement sent.',

  // Credentials
  'config.creds_title': 'Credentials Management Menu',
  'config.creds_no_creds': 'No credentials registered yet.',
  'config.creds_field_existing': 'Register existing account',
  'config.creds_field_existing_value': 'Use credentials from an account you\'ve already created.',
  'config.creds_field_new': 'Register new account',
  'config.creds_field_new_value': 'Register fresh credentials.',
  'config.creds_need_url': 'Register the URL first.',
  'config.button_add_url': 'Register CTF URL',
  'config.url_format_error': '⚠️ Invalid URL format. Try again.',
  'config.url_registered': '✅ URL registered.',
  'credentials.added': '✅ Credentials added.',

  // Events
  'event.ctf_started': '{role} The CTF has begun. To your stations.',
  'event.ctf_ended': '{role} The CTF has concluded. Well done.',
  'event.ctf_ended_thread': 'The CTF has concluded.',

  // Activity feed
  'feed.worker_join': '{user} joined {category}/{name}',
  'feed.worker_idle': '💤 {user} stepped away from {category}/{name}',
  'feed.solve': '✅ {solvers} solved {category}/{name}',
  'feed.unsolve': '{category}/{name} -- solve reverted',

  // Workon button
  'button.workon_unsolved': 'I\'ll have a look at this one.',
  'button.workon_solved': 'Already finished, but... have a look if you like.',
  'reply.joined_challenge': '✅ Joined `{name}`.',
  'msg.user_joined_thread': '{user} has joined.',

  // Challenge embed
  'challenge.click_to_participate': 'Press the button below to participate.',
  'challenge.workers_count': '{count} working',
  'challenge.no_challenges': 'No challenges yet.',
  'challenge.solved_count': '{solved}/{total} solved',

  // Settings
  'config.settings_title': 'CTF Settings',
  'config.settings_description': 'Use the buttons below to change settings.',
  'config.settings_not_set': 'Not set',
  'config.settings_field_flag': 'Flag format',
  'config.settings_field_event_id': 'Event ID',
  'config.settings_field_start': 'Start time',
  'config.settings_field_end': 'End time',
  'config.flag_format_success': '✅ Flag format set to `{value}`.',
  'config.schedule_success': '✅ Schedule updated.',
  'config.event_id_success': '✅ Event ID set to `{value}`.',
  'config.button_sync': 'Sync channels',
  'config.sync_success': 'Channel sync complete.',

  // Player manage
  'config.player_title': 'Player Management Menu',
  'config.player_field_role': 'Change CTF role',
  'config.player_field_role_value': 'Change the role assigned to this CTF.',
  'config.button_change_role': 'Change CTF role',
  'config.select_role': 'Choose a role.',
  'config.role_changed': '✅ Role for CTF **{name}** changed to {role}.',

  // Config - privacy
  'config.privacy_current': 'Current status: __**{status}**__.\nSwitch to **{opposite}**?',
  'config.privacy_public': 'public',
  'config.privacy_private': 'private',
  'config.privacy_toggle_button': 'Toggle',
  'config.privacy_error': '❌ Error toggling visibility: {error}',
  'config.privacy_changed': '✅ Changed visibility of {name} to __**{status}**__',

  // Config - back / session
  'config.back_button': 'Back',
  'config.session_expired': '❌ Session expired. Run /ctf config again.',

  // Config - rename modal
  'config.rename_modal_title': 'Rename CTF (current: {name})',
  'config.rename_modal_label': 'New CTF name',
  'config.rename_error': '❌ Error renaming: {error}',
  'config.rename_discord_warning': '⚠️ Renamed to **{name}**, but some Discord changes failed:\n{failures}\n\nCheck manually.',

  // Config - delete channels
  'config.deleting_channels': 'Deleting channels...',
  'config.delete_channels_partial': '❌ Some channels could not be deleted{details}',
  'config.delete_with_failures': '⚠️ Deleted CTF `{name}`. These channels must be removed manually:\n{channels}\n\nThis channel will be removed in 5 seconds.',

  // Config - settings modals
  'config.settings_flag_button': 'Flag format',
  'config.settings_flag_modal_title': 'Set flag format',
  'config.settings_flag_modal_label': 'Flag format (e.g. codegate{}, FLAG{}, flag{})',
  'config.settings_flag_error': '❌ Error changing flag format: {error}',
  'config.settings_schedule_button': 'Start/End time',
  'config.settings_schedule_modal_title': 'Change start/end time',
  'config.settings_start_label': 'Start time (YYYY-MM-DDTHH:MM, KST)',
  'config.settings_end_label': 'End time (YYYY-MM-DDTHH:MM, KST)',
  'config.settings_start_error': '❌ Invalid start time format. (YYYY-MM-DDTHH:MM)',
  'config.settings_end_error': '❌ Invalid end time format. (YYYY-MM-DDTHH:MM)',
  'config.settings_no_changes': '⚠️ No time values were entered.',
  'config.settings_schedule_error': '❌ Error changing schedule: {error}',
  'config.settings_event_id_button': 'Event ID',
  'config.settings_event_id_modal_title': 'Change CTFTime Event ID',
  'config.settings_event_id_label': 'CTFTime Event ID (e.g. hack-lu-ctf-2025)',
  'config.settings_event_id_error': '❌ Error changing Event ID: {error}',
  'config.settings_sync_button': 'Sync channels',
  'config.settings_sync_error': '❌ Error syncing: {error}',
  'config.settings_sync_complete': '**Channel sync complete.**\nCategory: <#{categoryId}>\n\n{results}',
  'config.settings_sync_category_error': '❌ Could not find the category channel.',
  'config.settings_sync_created': '(newly created)',
  'config.settings_sync_create_failed': 'creation failed',

  // Config - credentials URL modal
  'config.creds_url_modal_title': 'Register CTF URL',
  'config.creds_url_label': 'CTF URL',
  'config.creds_url_error': '⚠️ URL registration error: {error}',

  // Config - select menu labels
  'config.menu_ctf_manage': 'CTF Management',
  'config.menu_ctf_manage_desc': 'Rename, delete, archive',
  'config.menu_player_manage': 'Player Management',
  'config.menu_player_manage_desc': 'Add, remove members',
  'config.menu_creds_manage': 'Credentials Management',
  'config.menu_creds_manage_desc': 'Platform integration, login settings',
  'config.menu_ctf_settings': 'CTF Settings',
  'config.menu_ctf_settings_desc': 'Flag format, time, Event ID',

  // Config - player manage select
  'config.select_role_placeholder': 'Select a role.',
  'config.role_select_error': '❌ You must select a role.',
  'config.role_migration_failed': '⚠️ {count} members failed role migration: {names}',
  'config.role_delete_failed': '⚠️ Failed to delete previous role. Remove it manually.',
  'config.role_error': '❌ Error processing role.',
  'config.role_update_error': '❌ Error changing role: {error}',

  // Workon - additional messages
  'error.already_working': '⚠️ Already working on this.',
  'error.already_idle': '⚠️ Already resting.',
  'error.not_working': '⚠️ You\'re not working on this challenge.',
  'error.tryout_solved': '⚠️ `tryout` members cannot join solved challenges.',
  'error.ctf_not_found_short': '❌ Could not find the CTF.',
  'msg.user_joined_thread_content': '{user} has joined.',
  'reply.reactivated_challenge': '✅ Back on `{name}`.',
  'reply.deactivated_challenge': '💤 Taking a break from `{name}`.',

  // Solve - additional messages
  'solve.error_ctf_not_found': '❌ Could not find the CTF.',
  'solve.error_challenge_not_found': '❌ Could not find the challenge.',
  'solve.select_solver_prompt': 'Choose the main solver.',

  // Batch - additional messages
  'batch.error_server': '❌ Could not retrieve server information.',

  // CTF refreshthreads
  'cmd.ctf.refreshthreads.description': 'Make all challenge threads visible to everyone.',
  'cmd.ctf.refreshthreads.success': '✅ Refreshed {refreshed} threads. {failed} failed.',


  // CTF pull
  'cmd.ctf.pull.description': 'Fetch challenges and scoreboard from the platform.',
  'cmd.ctf.pull.no_cookie': 'No session cookie set. Add one via credentials (Token field).',
  'cmd.ctf.pull.result_title': 'Pull Result',
  'cmd.ctf.pull.created': 'Created',
  'cmd.ctf.pull.skipped': 'Skipped',
  'cmd.ctf.pull.errors': 'Errors',
  'cmd.ctf.pull.challenges_section': 'Challenges',
  'cmd.ctf.pull.scoreboard_section': 'Scoreboard',
  'cmd.ctf.pull.teams_count': 'Teams',
  'cmd.ctf.pull.my_team': 'Our team',
  'cmd.ctf.pull.new_challenges_feed': 'New challenges pulled',
  'cmd.ctf.pull.autopull_started': '...auto-pull enabled. Every 2 minutes.',
  'cmd.ctf.pull.autopull_stopped': 'Auto-pull stopped.',
  'cmd.ctf.pullignore.added': '`{name}` added to the ignore list.',
  'cmd.ctf.pullignore.removed': '`{name}` removed from the ignore list.',
  'cmd.ctf.pullignore.not_found': '`{name}` is not in the ignore list.',
  'cmd.ctf.pullignore.already': '`{name}` is already in the ignore list.',
  'cmd.ctf.pullignore.list_title': 'Pull Ignore List',
  'cmd.ctf.pullignore.list_empty': 'No ignored challenges.',

  // Scoreboard
  'cmd.ctf.scoreboard.title': 'Scoreboard',
  'cmd.ctf.scoreboard.my_team': 'Our team',


  // Credentials form
  'credentials.error_fetch': '❌ Error retrieving CTF information.',
} as const;

export default en;
