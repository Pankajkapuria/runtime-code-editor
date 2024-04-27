import React from 'react'

const Demo = () => {
    const user = "pankaj kapuria"
    let ans = "";
    ans = ans + user.charAt(0);
    for (let index = 1; index < user.length - 1; index++) {
        if (user.charAt(index) === ' ') {
            ans = ans + user.charAt(index + 1)
        }
        console.log(ans)
    }
    return (
        <div className='demo'>
            <p className='d'>{ans}</p>
        </div>
    )
}

export default Demo
