const nodemailer = require("nodemailer");
const fs = require("fs")

module.exports = async function mailOptions(data) {
    const transport = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        secure: "false",
        auth: {
            user: "noahcape@gmail.com",
            pass: "M@rcelle3!"
        }
    })


    const to = data.recipients
    const subject = `${data.journal_name} monthly update`
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    // for each jounral entry create a new file and then pull information from it to pull into html template
    // data.posts.map((post, index) => {
    //     const date = `${new Date(post.date).getDate()} ~ ${months[post.month]} ~ ${post.year}`
    //     const url = `http://localhost:3000/visitor/${data.journal_name.split(" ").join("_")}`

    //     const full_post = "journal name: " + data.journal_name + "\n" + 
    //                     "recipients: " + to + "\n" + 
    //                     "subject: " + subject + "\n" + 
    //                     "images: " + post.images + "\n" + 
    //                     "text: " + post.text + "\n" + 
    //                     "post date: " + date + "\n" + 
    //                     "journal url: " + url;

    //     fs.mkdir(`./middleware/emails/${data.journal_name.split(" ").join("_")}`, function (err, data) { })
    //     const fileName = `${data.journal_name.split(" ").join("_")}/email_${index}`
    //     fs.writeFile(`./middleware/emails/${fileName}`, full_post, function (err, test) {
    //         if (err) {
    //             console.error(err)
    //         } else {
    //             console.log(test)
    //         }
    //     })

    // })



    const htmlArray = data.posts.map(post =>
        `<div style="display: grid; margin-bottom: 0.5rem">
            <div style="background-color: #E3F7FF; border-radius: 12px; display: grid;">
                <div style="margin: 10px 10px 5px 5px; border-radius: 8px; display: block">
                    ${post.images.map(image => {
            return (
                `<div style="float: left; display: flex;">
                            <img src=${image} style="border-radius: 12px; height: 210px; max-height: 400px; max-width: 316px; margin: 10px 10px 5px 5px"/>
                        </div>`
            )
        }).join("")}
                    ${post.text !== "" ? (`<p style="margin: 10px; font-size: 17px;">${post.text}</p>`) : (``)}
                </div>
                <p style="padding: 12px; margin: 8px">${new Date(post.date).getDate()} ~ ${months[post.month]} ~ ${post.year}</p>
            </div>
        </div>\n`
    )

    const html = `<div style="padding: 5px; margin: 0 auto;">
            <h1>Your monthly update from ${data.journal_name}</h1>` + htmlArray.join("") +
        `<p>To see all photos and past posts go to this journals web page @ https://sharedjournal.capefamily.org/visitor/${data.journal_name.split(" ").join("_")}</p>
        </div>`

    to.map(recipient => {
        const mailOptions = {
            from: "sharedjournal@capefamily.org",
            to: recipient,
            subject,
            html
        }

        transport.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
        });
    })
}