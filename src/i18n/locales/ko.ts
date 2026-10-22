const ko = {
  // Language
  'lang.set': '확인했어. 한국어로 바꿔뒀어.',

  // Translation feature
  'translate.same': '이미 네 언어잖아. 번역할 게 없어.',
  'translate.empty': '번역할 내용이 없어.',
  'translate.error': '번역이 안 됐어. 다시 해볼래?',
  'translate.cooldown': '{sec}초 후에 다시 할 수 있어.',
  'translate.title': '번역',
  'translate.original': '원문',

  // General commands
  'cmd.ping.description': '살아있는지 확인해볼까',
  'cmd.ping.reply': '{ms}ms. 아직 멀쩡한 것 같아.',
  'cmd.ping.error': '예상 밖의 결과야',
  'cmd.echo.description': '그대로 전달해줄게',
  'cmd.echo.option_content': '전달할 내용',
  'cmd.about.description': '나에 대해 알려줄게',
  'cmd.about.title': '버틴',
  'cmd.about.body':
    '나는 기록하는 사람이야.\n' +
    '시대의 시작과 끝을... 그리고 지금은, 너희 팀의 CTF도.\n\n' +
    '참가 신청, 문제 풀이, 스코어보드.\n' +
    '필요한 건 전부 여기서 처리할 수 있어.\n\n' +
    '> 뭐가 됐든, 기록은 남기는 게 좋아.\n' +
    '> ...나중에 돌아볼 수 있으니까.',

  'cmd.help.description': '사용법을 안내해줄게',
  'cmd.help.intro_title': '버틴이야',
  'cmd.help.intro_body':
    'CTF 참가자들의 협력을 돕는 봇이야.\n' +
    '참가 신청, 문제 풀이, 스코어보드... 전부 여기서 처리할 수 있어.\n\n' +
    '> 처음이어도 괜찮아. 하나씩 안내할게.\n' +
    '> 아래 버튼으로 페이지를 넘기면 돼.',
  'cmd.help.join_title': '1️⃣ CTF에 참가하기',
  'cmd.help.join_body':
    '새 CTF가 열리면 공지 채널에 **참가 버튼**이 올라와.\n' +
    '버튼을 누르면 역할이 부여되고, CTF 채널들이 보이기 시작해.\n\n' +
    '커맨드로도 가능해:\n' +
    '```\n/ctf join ctfname: CTF이름\n```\n\n' +
    '참가하면 이런 채널들이 보여:\n' +
    '- **general** — 팀원들과 소통하는 곳.\n' +
    '- **announcements** — 문제 목록이 자동으로 정리돼.\n' +
    '- **credentials** — 대회 사이트 접속 정보. `/ctf showcreds`로도 확인 가능.\n\n' +
    '> 혼자 하는 게 아니니까. 일단 참가부터.\n' +
    '> 못 푸는 문제가 있어도 괜찮아. 같이 보면 보이는 게 있으니까.',
  'cmd.help.workon_title': '2️⃣ 문제에 참여하기',
  'cmd.help.workon_body':
    'CTF 채널에는 **카테고리별 텍스트 채널**이 있어. (web, pwn, crypto...)\n' +
    '각 채널 안에 문제마다 **스레드**가 하나씩 만들어져 있어.\n\n' +
    '풀고 싶은 문제가 있으면 참여 선언부터:\n' +
    '```\n/ctf workon name: 문제이름\n```\n' +
    '해당 스레드에 자동으로 추가돼. 안에서 논의하면서 풀면 돼.\n\n' +
    '> 💡 `/ctf workon all: True` — 전체 문제에 한번에 참여 가능\n\n' +
    'announcements 채널의 문제 목록에서 **workon 버튼**을 눌러도 돼.\n\n' +
    '> 하나만. workon 해놓고 조용히 있지는 마.\n' +
    '> 뭘 시도했는지, 어디서 막혔는지 스레드에 남겨둬.\n' +
    '> 네가 안 된다고 끄적인 메모가 다른 사람에게는 열쇠가 될 수도 있으니까.',
  'cmd.help.solve_title': '3️⃣ 문제 풀이 등록하기',
  'cmd.help.solve_body':
    '문제를 풀었으면 해당 스레드 안에서:\n' +
    '```\n/ctf solve\n```\n' +
    '**Solve 패널**이 나타나고, 여기서:\n\n' +
    '1. **Contributors** — 같이 푼 사람들 선택\n' +
    '2. **Flag 입력** — 플래그 기록\n' +
    '3. **Submit** — 제출\n\n' +
    '제출하면 스레드가 ✅로 바뀌고,\n' +
    '**solves** 채널에 풀이 공지가 올라가.\n' +
    '**feed** 채널에서 실시간 활동 로그도 확인할 수 있어.\n\n' +
    '> 기여한 사람이 있으면 Contributors에 꼭 넣어줘.\n' +
    '> 힌트 하나, 아이디어 하나가 결정적이었을 수도 있으니까.\n' +
    '> ...기록은 정확해야 해.\n\n' +
    '> 잘못 등록했으면 `/ctf solve`로 수정하거나 **Unsolve**로 되돌릴 수 있어.',
  'cmd.help.profile_title': '4️⃣ 번역 기능',
  'cmd.help.profile_body':
    '글로벌 팀이니까 번역 기능이 있어.\n\n' +
    '**메시지 우클릭 → Apps → Translate**\n' +
    '해당 메시지 하나를 번역해. 나만 보이는 메시지로.\n\n' +
    '**메시지 우클릭 → Apps → Translate (Context)**\n' +
    '위아래 5개 메시지를 포함해서 대화 전체를 번역해.\n\n' +
    '**메시지 우클릭 → Apps → Translate (User)**\n' +
    '그 사람이 연속으로 쓴 메시지를 묶어서 번역해. 끊어 말하는 경우에 유용해.\n\n' +
    '> 한국어, 영어, 일본어, 핀란드어를 지원해.\n' +
    '> 디스코드 클라이언트 언어 설정을 따라가니까 별도 설정은 필요 없어.',
  'cmd.help.tips_title': '알아두면 좋은 것들',
  'cmd.help.tips_body':
    '**자기 분야 아닌 문제도 들어가 봐.**\n' +
    'Web만 하던 사람이 Misc에서 결정적 발견을 할 수도 있어.\n' +
    '모르는 분야라도 스레드에 들어가서 읽어보는 것만으로 도움이 돼.\n\n' +
    '**작은 것도 공유해.**\n' +
    '"이건 아닌 것 같다"도 정보야. 삽질 기록이 팀 전체의 시간을 아껴주니까.\n' +
    'CTF는 결국 팀 게임이야. 소통하는 다섯 명이 혼자 하는 한 명보다 강해.\n\n' +
    '**유용한 커맨드:**\n' +
    '`/ctf status` — 현재 CTF 진행 현황\n' +
    '`/ctf showcreds` — 대회 접속 정보\n\n' +
    '**채널 한눈에 보기:**\n' +
    '`general` 소통 · `announcements` 문제 목록 · `credentials` 접속 정보\n' +
    '`solves` 풀이 공지 · `feed` 실시간 활동\n\n' +
    '> 모르면 물어봐. 팀원들이 도와줄 거야.\n' +
    '> ...함께하면 더 강해지는 건 맞으니까.',

  // Error messages (shared)
  'error.unknown_command': '...그런 건 처음 들어.',
  'error.unknown_subcommand': '그런 항목은 없어.',
  'error.no_permission': '그건 네 권한 밖이야.',
  'error.unexpected': '예상 밖의 일이 생겼어. 다시 해볼래?',
  'error.unknown_component': '...알 수 없는 동작이야.',
  'error.fetch_ctf': 'CTF 정보를 가져올 수 없었어.',
  'error.not_in_ctf_channel': 'CTF 채널 안에서 실행해.',
  'error.archived_ctf': '아카이브된 CTF야.',
  'error.ctf_not_found': '그런 CTF는 없어.',
  'error.challenge_not_found': '그런 문제는 없어.',
  'error.ctf_role_not_found': 'CTF 역할을 찾을 수 없어. 관리자에게 확인해.',
  'error.already_joined': '이미 참여 중이야.',

  // CTF join
  'cmd.ctf.join.description': 'CTF에 참가해.',
  'cmd.ctf.join.option_ctfname': '참가할 CTF 이름.',
  'cmd.ctf.join.error_private': '비공개 CTF야. 관리자 초대가 필요해.',
  'cmd.ctf.join.success': '✅ {ctfName}에 등록했어.',
  'msg.user_joined': '{user}님이 합류했어.',
  'cmd.ctf.join.left': '...{ctfName}에서 나갔어. 버튼을 다시 누르면 돌아올 수 있어.',
  'msg.feed.participant_joined': '**참가** · {user}님이 대회에 합류했어.',
  'msg.feed.participant_left': '**퇴장** · {user}님이 대회에서 나갔어.',

  // CTF workon
  'cmd.ctf.workon.description': '문제 스레드에 참여해.',
  'cmd.ctf.workon.option_name': '문제 이름. 대소문자 무관.',
  'cmd.ctf.workon.option_all': '전체 문제에 참여할지 여부.',
  'cmd.ctf.workon.success': '✅ `{name}` 문제에 등록했어.',
  'cmd.ctf.workon.success_all': '✅ {count}개 문제에 등록했어.',
  'cmd.ctf.workon.error_tryout': '`tryout` 멤버는 풀린 문제에 참여할 수 없어.',
  'cmd.ctf.workon.error_add': '참여 처리 중 오류가 났어.',
  'msg.workon_all': '{user} → 전체 문제 참여 ({count}개)',

  // CTF solve
  'cmd.ctf.solve.description': '풀이를 등록해.',
  'cmd.ctf.solve.error_need_thread': '문제 스레드 안에서 실행해.',
  'cmd.ctf.solve.error_permission': 'main solver나 관리자만 수정할 수 있어.',

  // CTF status
  'cmd.ctf.status.description': 'CTF 진행 상황을 확인해.',
  'cmd.ctf.status.option_ctfname': 'CTF 이름. 기본값은 현재 채널.',
  'cmd.ctf.status.option_mode': '전체 또는 미해결 문제만 표시.',
  'cmd.ctf.status.no_active': '진행 중인 CTF가 없어.',
  'cmd.ctf.status.no_challenges': '아직 등록된 문제가 없어.',

  // CTF scoreboard
  'cmd.ctf.scoreboard.description': '스코어보드를 확인해.',
  'cmd.ctf.scoreboard.unavailable': '스코어보드 기능은 현재 사용할 수 없어. 크레덴셜 채널에서 직접 확인해.',

  // CTF create challenge
  'cmd.ctf.createchallenge.description': '새 문제를 추가해.',
  'cmd.ctf.createchallenge.option_category': '카테고리.',
  'cmd.ctf.createchallenge.option_name': '이름. 비워두면 배치 생성 모달이 열려.',
  'cmd.ctf.createchallenge.error_exists': '이미 같은 이름의 문제가 있어.',
  'cmd.ctf.createchallenge.success': '✅ `{name}` 문제를 만들었어.',

  // CTF delete challenge
  'cmd.ctf.deletechallenge.description': '문제를 삭제해.',
  'cmd.ctf.deletechallenge.option_name': '삭제할 문제 이름. 기본값은 현재 스레드.',
  'cmd.ctf.deletechallenge.error_need_target': '문제 스레드에서 실행하거나 이름을 지정해.',
  'cmd.ctf.deletechallenge.error_remove': '삭제 중 오류가 났어.',
  'cmd.ctf.deletechallenge.success': '✅ `{name}` 문제를 삭제했어.',

  // CTF rename challenge
  'cmd.ctf.renamechallenge.description': '문제 이름을 변경해.',
  'cmd.ctf.renamechallenge.option_new': '새 이름.',
  'cmd.ctf.renamechallenge.option_old': '대상 문제 이름.',
  'cmd.ctf.renamechallenge.success': '✅ 문제 이름을 변경했어.',

  // CTF addplayers
  'cmd.ctf.addplayers.description': '멤버를 CTF에 직접 추가해.',
  'cmd.ctf.addplayers.option_user': '추가할 멤버.',
  'cmd.ctf.addplayers.option_ctfname': 'CTF 이름.',
  'cmd.ctf.addplayers.error_member_not_found': '서버에서 찾을 수 없어.',
  'cmd.ctf.addplayers.success': '✅ {member}님을 등록했어.',

  // CTF showcreds
  'cmd.ctf.showcreds.description': '접속 정보를 확인해.',
  'cmd.ctf.showcreds.option_ctfname': 'CTF 이름. 기본값은 현재 채널.',
  'cmd.ctf.showcreds.error_need_context': 'CTF 채널에서 실행하거나 이름을 지정해.',

  // CTF assign
  'cmd.ctf.assign.description': '새 CTF를 만들어.',
  'cmd.ctf.assign.embed_title': '새 기록 시작',
  'cmd.ctf.assign.embed_description': '직접 만들기 버튼을 눌러.',
  'cmd.ctf.assign.footer': '30분 후에 사라져.',
  'button.direct_create': '직접 만들기',
  'button.join': '참가',
  'button.continue': '진행',
  'button.edit': '수정',
  'button.confirm': '이대로 진행',

  // Config
  'cmd.ctf.config.description': 'CTF 설정을 손볼 수 있어.',
  'config.home_title': 'CTF 관리 대시보드',
  'config.home_description': '어디를 손보면 될까.',
  'config.archived_title': '아카이브된 CTF 관리',
  'config.archived_description': '아카이브 상태야. 할 수 있는 건 제한돼 있어.',
  'config.field_ctf_manage': 'CTF 관리',
  'config.field_ctf_manage_value': '이름 변경, 삭제',
  'config.field_player_manage': '참가자 관리',
  'config.field_player_manage_value': '인원 추가, 제거, 역할 변경',
  'config.field_creds_manage': '인증정보 관리',
  'config.field_creds_manage_value': '접속 정보 설정',
  'config.footer_30m': '30분 후에 사라져.',
  'config.footer_10m': '10분 후에 사라져.',
  'config.menu_placeholder': '어디를 손보면 될까.',
  'config.manage_title': 'CTF 관리 메뉴',
  'config.manage_description': '아래 버튼으로 관리할 수 있어.',
  'config.manage_field_rename': 'CTF 이름 변경',
  'config.manage_field_rename_value': 'CTF 이름을 바꿀 수 있어.',
  'config.manage_field_privacy': 'CTF 공개 설정',
  'config.manage_field_privacy_value': '공개 상태를 전환할 수 있어.',
  'config.manage_field_delete': 'CTF 삭제',
  'config.manage_field_delete_value': '전부 사라져. 되돌릴 수 없으니까, 신중하게.',
  'config.button_rename': 'CTF 이름 변경',
  'config.button_delete': 'CTF 삭제',
  'config.button_delete_channels': '채널 삭제',
  'config.button_privacy': '공개 전환',
  'config.delete_confirm_title': '정말 삭제하는 거야?',
  'config.delete_confirm_label': '전부 사라져. 확인하려면 CTF 이름을 입력해.',
  'config.delete_name_mismatch': '❌ 이름이 맞지 않아.',
  'config.delete_success': '✅ `{name}` CTF를 삭제했어.\n5초 후에 이 채널도 사라져.',
  'config.rename_success': '✅ CTF 이름을 **{name}**(으)로 바꿨어.',
  'config.channels_deleted': '✅ `{name}` 채널 {count}개 삭제했어. DB는 남겨뒀어.',

  // Solve panel
  'solve.no_contributors': '없음',
  'solve.no_flag': '미입력',
  'solve.status_submitted': 'Submit 완료. 수정하려면 아래 버튼을 눌러.',
  'solve.placeholder_contributors': '같이 푼 사람을 선택해.',
  'solve.button_flag': 'Flag 입력',
  'solve.button_change_solver': 'Solver 변경',
  'solve.button_save': '수정 저장',
  'solve.button_unsolve': 'Unsolve',
  'solve.button_submit': 'Submit',
  'solve.modal_flag_title': 'Flag 입력',
  'solve.modal_flag_placeholder': 'flag를 입력해.',
  'solve.select_solver': '메인으로 푼 사람을 골라.',
  'solve.solver_changed': '✅ Solver를 바꿨어. 수정 저장을 눌러서 반영해.',
  'solve.solved_title': 'Challenge solved!',

  // Batch challenge
  'batch.modal_title': '{category} 챌린지 배치 생성',
  'batch.modal_label': '문제 이름들 (줄바꿈으로 구분)',
  'batch.error_no_names': '❌ 문제 이름을 입력해야 해.',
  'batch.created': '✅ {count}개 생성',
  'batch.skipped': '⏭️ {count}개 건너뜀 (이미 존재)',
  'batch.failed': '❌ {count}개 실패',

  // Announce
  'announce.preview_title': '공지 메시지 미리보기',
  'announce.modal_title': '공지 메시지 수정',
  'announce.modal_label': '공지 내용',
  'announce.modal_placeholder': '공지 내용을 적어.',
  'announce.sent': '✅ 공지 발송했어.',

  // Credentials
  'config.creds_title': '인증 정보 관리 메뉴',
  'config.creds_no_creds': '인증 정보가 아직 없어.',
  'config.creds_field_existing': '기존 계정 정보 등록',
  'config.creds_field_existing_value': '이미 가입한 계정 정보로 등록할 수 있어.',
  'config.creds_field_new': '새 계정 정보 등록',
  'config.creds_field_new_value': '계정 정보를 새로 등록할 수 있어.',
  'config.creds_need_url': 'URL부터 등록해야 해.',
  'config.button_add_url': 'CTF URL 등록',
  'config.url_format_error': '⚠️ URL 형식이 맞지 않아. 다시 입력해.',
  'config.url_registered': '✅ URL을 등록했어.',
  'credentials.added': '✅ Credentials added.',

  // Events
  'event.ctf_started': '{role} CTF가 시작됐어. 각자 자리에 붙어.',
  'event.ctf_ended': '{role} CTF가 끝났어. 수고했어.',
  'event.ctf_ended_thread': 'CTF가 끝났어.',

  // Activity feed
  'feed.worker_join': '{user} → {category}/{name} 참여',
  'feed.worker_idle': '💤 {user} → {category}/{name} 쉬는 중',
  'feed.solve': '✅ {solvers} → {category}/{name} 풀이 완료',
  'feed.unsolve': '{category}/{name} — 풀이 취소됨',

  // Workon button
  'button.workon_unsolved': '이 문제, 내가 볼게.',
  'button.workon_solved': '이미 끝난 건이긴 한데... 보고 싶으면 봐.',
  'reply.joined_challenge': '✅ `{name}`에 참여했어.',
  'msg.user_joined_thread': '{user}님이 참여했어.',

  // Challenge embed
  'challenge.click_to_participate': '참여하려면 아래 버튼을 눌러.',
  'challenge.workers_count': '{count}명 참여 중',
  'challenge.no_challenges': 'No challenges yet.',
  'challenge.solved_count': '{solved}/{total} solved',

  // Settings
  'config.settings_title': 'CTF 설정',
  'config.settings_description': '아래 버튼으로 설정을 바꿀 수 있어.',
  'config.settings_not_set': '미설정',
  'config.settings_field_flag': 'Flag 형식',
  'config.settings_field_event_id': 'Event ID',
  'config.settings_field_start': '시작 시각',
  'config.settings_field_end': '종료 시각',
  'config.flag_format_success': '✅ Flag 형식을 `{value}`(으)로 바꿨어.',
  'config.schedule_success': '✅ 시각을 바꿨어.',
  'config.event_id_success': '✅ Event ID를 `{value}`(으)로 바꿨어.',
  'config.button_sync': '채널 동기화',
  'config.sync_success': '채널 동기화 완료.',

  // Player manage
  'config.player_title': '참가자 관리 메뉴',
  'config.player_field_role': 'CTF 역할 변경',
  'config.player_field_role_value': '현재 CTF에 할당된 역할을 바꿀 수 있어.',
  'config.button_change_role': 'CTF 역할 변경',
  'config.select_role': '역할을 골라.',
  'config.role_changed': '✅ CTF **{name}**의 역할을 {role}(으)로 바꿨어.',

  // Config - privacy
  'config.privacy_current': '현재 상태: __**{status}**__야.\n**{opposite}**(으)로 전환할까.',
  'config.privacy_public': '공개',
  'config.privacy_private': '비공개',
  'config.privacy_toggle_button': '전환',
  'config.privacy_error': '❌ 공개 설정을 바꾸다 오류가 났어: {error}',
  'config.privacy_changed': '✅ {name}의 공개 설정을 __**{status}**__(으)로 바꿨어',

  // Config - back / session
  'config.back_button': '뒤로가기',
  'config.session_expired': '❌ 세션이 만료됐어. /ctf config를 다시 실행해.',

  // Config - rename modal
  'config.rename_modal_title': 'CTF 이름 변경 (현재: {name})',
  'config.rename_modal_label': '새 CTF 이름',
  'config.rename_error': '❌ 이름을 바꾸다 오류가 났어: {error}',
  'config.rename_discord_warning': '⚠️ CTF 이름을 **{name}**(으)로 바꿨는데, 일부 Discord 반영에 실패했어:\n{failures}\n\n직접 확인해 봐.',

  // Config - delete channels
  'config.deleting_channels': '채널 삭제 중...',
  'config.delete_channels_partial': '❌ 일부 채널을 삭제하지 못했어{details}',
  'config.delete_with_failures': '⚠️ `{name}` CTF를 삭제했어. 아래 채널은 직접 지워야 해:\n{channels}\n\n5초 후에 이 채널도 사라져.',

  // Config - settings modals
  'config.settings_flag_button': 'Flag 형식',
  'config.settings_flag_modal_title': 'Flag 형식 설정',
  'config.settings_flag_modal_label': 'Flag 형식 (예: codegate{}, FLAG{}, flag{})',
  'config.settings_flag_error': '❌ Flag 형식을 바꾸다 오류가 났어: {error}',
  'config.settings_schedule_button': '시작/종료 시각',
  'config.settings_schedule_modal_title': '시작/종료 시각 변경',
  'config.settings_start_label': '시작 시각 (YYYY-MM-DDTHH:MM, KST)',
  'config.settings_end_label': '종료 시각 (YYYY-MM-DDTHH:MM, KST)',
  'config.settings_start_error': '❌ 시작 시각 형식이 맞지 않아. (YYYY-MM-DDTHH:MM)',
  'config.settings_end_error': '❌ 종료 시각 형식이 맞지 않아. (YYYY-MM-DDTHH:MM)',
  'config.settings_no_changes': '⚠️ 바꿀 시각이 입력되지 않았어.',
  'config.settings_schedule_error': '❌ 시각을 바꾸다 오류가 났어: {error}',
  'config.settings_event_id_button': 'Event ID',
  'config.settings_event_id_modal_title': 'CTFTime Event ID 변경',
  'config.settings_event_id_label': 'CTFTime Event ID (예: hack-lu-ctf-2025)',
  'config.settings_event_id_error': '❌ Event ID를 바꾸다 오류가 났어: {error}',
  'config.settings_sync_button': '채널 동기화',
  'config.settings_sync_error': '❌ 동기화하다 오류가 났어: {error}',
  'config.settings_sync_complete': '**채널 동기화 완료.**\n카테고리: <#{categoryId}>\n\n{results}',
  'config.settings_sync_category_error': '❌ 카테고리 채널을 찾을 수 없었어.',
  'config.settings_sync_created': '(새로 생성)',
  'config.settings_sync_create_failed': '생성 실패',

  // Config - credentials URL modal
  'config.creds_url_modal_title': 'CTF URL 등록',
  'config.creds_url_label': 'CTF URL',
  'config.creds_url_error': '⚠️ URL을 등록하다 오류가 났어: {error}',

  // Config - select menu labels
  'config.menu_ctf_manage': 'CTF 관리',
  'config.menu_ctf_manage_desc': '이름 변경, 삭제, 아카이브',
  'config.menu_player_manage': '참가자 관리',
  'config.menu_player_manage_desc': '인원 추가, 제거',
  'config.menu_creds_manage': '인증정보 관리',
  'config.menu_creds_manage_desc': '플랫폼 연동, 로그인 설정',
  'config.menu_ctf_settings': 'CTF 설정',
  'config.menu_ctf_settings_desc': 'Flag 형식, 시각, Event ID',

  // Config - player manage select
  'config.select_role_placeholder': '역할을 선택해.',
  'config.role_select_error': '❌ 역할을 선택해야 해.',
  'config.role_migration_failed': '⚠️ {count}명 역할 이전 실패: {names}',
  'config.role_delete_failed': '⚠️ 이전 역할 삭제에 실패했어. 직접 지워야 해.',
  'config.role_error': '❌ 역할을 처리하다 오류가 났어.',
  'config.role_update_error': '❌ 역할을 바꾸다 오류가 났어: {error}',

  // Workon - additional messages
  'error.already_working': '⚠️ 이미 붙고 있어.',
  'error.already_idle': '⚠️ 이미 쉬고 있어.',
  'error.not_working': '⚠️ 이 문제에 붙고 있지 않아.',
  'error.tryout_solved': '⚠️ `tryout` 멤버는 이미 풀린 문제에 참여할 수 없어.',
  'error.ctf_not_found_short': '❌ CTF를 찾을 수 없었어.',
  'msg.user_joined_thread_content': '{user}님이 참여했어.',
  'reply.reactivated_challenge': '✅ `{name}`에 다시 붙었어.',
  'reply.deactivated_challenge': '💤 `{name}`에서 잠깐 쉬는 중.',

  // Solve - additional messages
  'solve.error_ctf_not_found': '❌ CTF를 찾을 수 없었어.',
  'solve.error_challenge_not_found': '❌ 문제를 찾을 수 없었어.',
  'solve.select_solver_prompt': '메인으로 푼 사람을 골라.',

  // Batch - additional messages
  'batch.error_server': '❌ 서버 정보를 가져올 수 없었어.',

  // CTF refreshthreads
  'cmd.ctf.refreshthreads.description': '모든 챌린지 스레드를 전원에게 보이게 해.',
  'cmd.ctf.refreshthreads.success': '✅ {refreshed}개 스레드 새로고침. {failed}개 실패.',


  // CTF pull
  'cmd.ctf.pull.description': '플랫폼에서 문제와 스코어보드를 가져와.',
  'cmd.ctf.pull.no_cookie': '세션 쿠키가 없어. 크레덴셜의 Token 필드에 추가해.',
  'cmd.ctf.pull.result_title': 'Pull 결과',
  'cmd.ctf.pull.created': '생성됨',
  'cmd.ctf.pull.skipped': '스킵',
  'cmd.ctf.pull.errors': '오류',
  'cmd.ctf.pull.challenges_section': '문제',
  'cmd.ctf.pull.scoreboard_section': '스코어보드',
  'cmd.ctf.pull.teams_count': '팀 수',
  'cmd.ctf.pull.my_team': '우리 팀',
  'cmd.ctf.pull.new_challenges_feed': '새로 가져온 문제',
  'cmd.ctf.pull.autopull_started': '...자동 풀링 켜짐. 2분마다.',
  'cmd.ctf.pull.autopull_stopped': '자동 풀링 꺼짐.',
  'cmd.ctf.pullignore.added': '`{name}` 무시 목록에 추가했어.',
  'cmd.ctf.pullignore.removed': '`{name}` 무시 목록에서 제거했어.',
  'cmd.ctf.pullignore.not_found': '`{name}` 무시 목록에 없어.',
  'cmd.ctf.pullignore.already': '`{name}` 이미 무시 목록에 있어.',
  'cmd.ctf.pullignore.list_title': 'Pull 무시 목록',
  'cmd.ctf.pullignore.list_empty': '무시 목록이 비어 있어.',

  // Scoreboard
  'cmd.ctf.scoreboard.title': '스코어보드',
  'cmd.ctf.scoreboard.my_team': '우리 팀',


  // Credentials form
  'credentials.error_fetch': '❌ CTF 정보를 가져오다 오류가 났어.',
} as const;

export default ko;
