del *.js
cd src\lib
echo (function(){ >> ..\..\telligent.evolution.mobile.js
type ..\define.js >> ..\..\telligent.evolution.mobile.js
for /r %%x in (*.js) do (
	type "%%x" >> ..\..\telligent.evolution.mobile.js
    echo. >> ..\..\telligent.evolution.mobile.js
    echo. >> ..\..\telligent.evolution.mobile.js
)
type ..\main.js >> ..\..\telligent.evolution.mobile.js
echo. >> ..\..\telligent.evolution.mobile.js
echo }()); >> ..\..\telligent.evolution.mobile.js
cd ..\..
REM copy telligent.evolution.mobile.js ..\TelligentEvolution.Mobile.Web\Scripts\telligent.evolution.mobile.js
java -jar support\closure\compiler.jar --js telligent.evolution.mobile.js --js_output_file telligent.evolution.mobile.min.js
copy telligent.evolution.mobile.min.js ..\TelligentEvolution.Mobile.Web\Scripts\telligent.evolution.mobile.js
pause