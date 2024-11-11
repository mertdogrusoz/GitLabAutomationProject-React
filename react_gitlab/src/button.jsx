
function Button()
{
    let count = 0;
    const handleClick2 = (name) =>{
        count++;

        console.log(`${count}`);

    }

    return(
        <button onClick={handleClick2}>Click</button>

       
    )



}

export default Button;