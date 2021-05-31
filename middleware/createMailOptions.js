const nodemailer = require("nodemailer");
require("dotenv").config()

module.exports = async function mailOptions(data) {
    const transport = nodemailer.createTransport({
        host: 'smtp.ionos.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    })

    if (data.recipients.length === 0) {
        return
    }

    const to = data.recipients
    const subject = `${data.journal_name} monthly update`
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    const htmlArray = data.posts.map(post =>
        `<div style="display: grid; margin-bottom: 0.5rem">
            <div style="background-color: #E3F7FF; border-radius: 12px; display: grid;">
                <div style="margin: 10px 10px 5px 5px; border-radius: 8px; display: block">
                  
                <div style="float: left; display: flex;">
                    <img src=${post.images[0]} style="border-radius: 12px; height: 210px; max-height: 400px; max-width: 316px; margin: 10px 10px 5px 5px"/>
                </div>

                    ${post.text !== "" ? (`<p style="margin: 10px; font-size: 17px;">${post.text}</p>`) : (``)}
                </div>
                <p style="padding: 12px; margin: 8px">${new Date(post.date).getDate()} ~ ${months[post.month]} ~ ${post.year}</p>
            </div>
        </div>\n`
    )

    const html = `<div style="padding: 5px; margin: 0 auto;">
            <h1>Your monthly update from ${data.journal_name}</h1>` + htmlArray.join("") +
        `<p>To see all photos and past posts go to this journal's web page @ <a href="https://sharedjournal.capefamily.org/visitor/${data.journal_name.split(" ").join("_")}">${data.journal_name}</a></p>
        <a href="https://sharedjournal.capefamily.org/unsubscribe/${data.journal_name.split(" ").join("_")}">Unsubscribe</a>
        </div>`

    const mailOptions = {
        from: "Shared Journal <sharedjournal@capefamily.org>",
        to: "sharedjournal@capefamily.org",
        replyTo: data.userEmail,
        subject,
        bcc: to,
        html
    }

    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}