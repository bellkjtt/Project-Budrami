#2024-11-16 업데이트 된 중요사항
##DB, models.py가 업데이트 됨에 따라
*python manage.py makemigrations*
*python manage.py migrate* 

##한번 해주셔야 합니다.


#사용방법

budrami-django는 똑같습니다. gemini 들어가서 바꾸면 됩니다.

tts-api 폴더에서 index.js 키는 것도 잊지마세요.
node index.js

달라진 점은 그냥 root 폴더에서 react만 키면 해당 페이지에서 상호작용할 수 있다는 점입니다.
npm start

컴포넌트는 src/component 폴더에 이름별로 나누어놓았고, App.js에 헤더만 고정하고 라우팅 해놓았습니다.
페이지를 추가하시려면 src/pages 폴더에 추가하셔서 App.js에 라우팅하시면 됩니다.
