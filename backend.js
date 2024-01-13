const express=require("express");
const zod=require("zod");
const jwt=require("jsonwebtoken");
const cors=require("cors");
const bcrypt = require('bcrypt');


const jwtPassword="12345";

const app=express()
app.use(express.json())
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));


const mongoose=require("mongoose");
mongoose.connect("")
const User=mongoose.model('users',{
    username:String,
    email:String,
    password:String
})


async function validateUser(req,res,next){
    const email=req.headers.email;
    const existingUser= await User.findOne({email:email})
    if(existingUser){
        return res.status(400).send("Username already created")
    }else{
        next();
    }
    
}

const authenticateUser = (req, res, next) => {
    const token = req.cookies.jwt; // Assuming you're storing the JWT in a cookie

    if (!token) {
        return res.status(401).json({
            "Message": "Unauthorized access"
        });
    }

    try {
        // Verify the token
        const decodedToken = jwt.verify(token, jwtPassword);
        req.user = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({
            "Message": "Unauthorized access"
        });
    }
};


app.post("/signup",validateUser,async function(req,res){
    const username=req.headers.username;
    const email=req.headers.email;
    const password=req.headers.password

    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

    const schema=zod.object({
        username:zod.string().min(4).max(13),
        password:zod.string().min(8),
        email:zod.string().email()
    })

    const validation=schema.safeParse({username,email,password});

    if(!validation.success){
        res.status(400).send(validation.error.details[0].message);
    }
    const user=new User({
        username:username,
        password:hashedPassword,
        email:email
    })
    user.save();
    const token=jwt.sign({
        email:email
    },jwtPassword)

    res.cookie('jwt', token, { httpOnly: true });

    res.json({
        "Message":username + " signed up successfully!"
    });
})


app.post("/login", async function (req, res) {
    console.log("User in");
    const email=req.headers.email;
    const password=req.headers.password


    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                "Message": "User not found"
            });
        }

        // Verify the password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                "Message": "Incorrect password"
            });
        }

        const token = jwt.sign({
            email: user.email
        }, jwtPassword);

        res.cookie('jwt', token, { httpOnly: true });

        res.json({
            "msg":"party karo oyee"
        })

        

    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send("Internal Server Error");
        }
//     res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.header("Access-Control-Allow-Credentials", "true");
});

const todos=mongoose.model("todos",{
    title:String,
    description:String,
    id:Number,
    onDone:Boolean
})

app.get("/todos",authenticateUser,function(req,res){
    const title=req.headers.title;
    const description=req.headers.description;
    const id=req.headers.id;

    const task=todos({
        title:title,
        description:description,
        id:id,
        onDone:false
    })
    task.save()

})
app.get("/todos/done",function(req,res){
    const id=req.headers.id;
    const onDone=true;
    try{
    todos.findOneAndUpdate({id:id},
      {onDone:onDone}  )
    }catch(err){
        res.status(401).send("This work is done already");
    }

})

app.listen(3000);
