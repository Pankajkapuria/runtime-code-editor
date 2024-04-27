import React, { useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import ACTIONS from '../Actions';


function Edtior({ socketRef, roomId, onCodeChange }) {
    const [value, setValue] = React.useState("// write your code here");

    const onChange = React.useCallback((val) => {
        setValue(val);
        onCodeChange(val);
        socketRef.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code: value,
        })

    }, [socketRef, roomId, value, onCodeChange]);

    useEffect(() => {

        if (socketRef !== null) {

            socketRef.on(ACTIONS.JOINED, ({ socketId }) => {
                socketRef.emit('code_sync', {
                    socketId,
                    code: value
                })
            })


            socketRef.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                setValue(code)
            })

            return () => {
                socketRef.off(ACTIONS.CODE_CHANGE)
            }
        }



    }, [socketRef, roomId, value])


    return <>
        <CodeMirror value={value} height="100vh" onChange={onChange} extensions={[langs.javascript()]} />
    </>;
}
export default Edtior;

