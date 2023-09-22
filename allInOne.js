import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";
import 'https://code.jquery.com/jquery-3.6.0.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
let url = "https://cdn.jsdelivr.net/combine/gh/NicolasSponton/IpCallWebChatWidget@combined/index.html"

window.onload = function() {
    let request = new XMLHttpRequest()
    
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            let text = request.responseText
            
            const div = document.createElement('div');
            div.classList.add('ipCallChatWidGet');
            div.innerHTML = text.slice(text.indexOf("<body>") + 6, text.indexOf("</body>"));
            document.body.insertBefore(div, document.body.firstChild);

            ///font Awesome
            var linkElement = document.createElement('link');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('href', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
            var headElement = document.head || document.getElementsByTagName('head')[0];
            headElement.appendChild(linkElement);

            /////////////////////////////////////  Codigo del Chat  //////////////////////////////////////////
            
            var element = $('.floating-chat');
            const form = document.querySelector('.floating-chat #myForm');
            const footer = document.querySelector('.floating-chat .footer');
            const textBox = document.querySelector('.floating-chat .text-box');

            const HOST = 'localhost:7001'

            //Socket
            const socket = io("ws://192.168.100.22:4444");
            socket.on("connect_error", (err) => console.log(`IPCHAT: connect_error debido a ${err} `));
            socket.on('connect', () => console.log(`IPCHAT: connect `));

            form?.addEventListener('submit', handleSubmit);

            const state = {
                conversationId: 0,
                logged: false,
                nombre: '',
                mail: '',
                ...JSON.parse(localStorage.getItem('ipChatState')),
            }

            if(Boolean(state.conversationId)){
                console.log("Escuchando: ====== "+ state.conversationId +" ======");
                socket.on('c' + state.conversationId, handleReceivedMessage)
            }

            console.log("state; ", state.logged);

            if(state.logged){
                form.style.display = 'none';
                addMessage('¿En que podemos alludarte?', 'other')
            } else {
                footer.style.display = 'none';
            }

            function handleReceivedMessage(res) {
                addMessage(res.data.message.message, res.data.message.from_me ? 'other' : 'self')
            }

            setTimeout(function() {
                element.addClass('enter');
            }, 1000);

            element.click(openElement);

            function openElement() {

                var messages = element.find('.messages');
                var textInput = element.find('.text-box');
                element.find('>i').hide();
                element.addClass('expand');
                element.find('.chat').addClass('enter');
                var strLength = textInput.val().length * 2;
                textInput.keydown(onMetaAndEnter).prop("disabled", false).focus();
                element.off('click', openElement);
                element.find('.header button').click(closeElement);
                element.find('#sendMessage').click(sendNewMessage);
                messages.scrollTop(messages.prop("scrollHeight"));
            }

            function closeElement() {
                element.find('.chat').removeClass('enter').hide();
                element.find('>i').show();
                element.removeClass('expand');
                element.find('.header button').off('click', closeElement);
                element.find('#sendMessage').off('click', sendNewMessage);
                element.find('.text-box').off('keydown', onMetaAndEnter).prop("disabled", true).blur();
                setTimeout(function() {
                    element.find('.chat').removeClass('enter').show()
                    element.click(openElement);
                }, 500);
            }

            function sendNewMessage() {
                var userInput = $('.text-box');
                var newMessage = userInput.html().replace(/\<div\>|\<br.*?\>/ig, '\n').replace(/\<\/div\>/g, '').trim().replace(/\n/g, '<br>');
                if (!newMessage) return;

                fetch('http://localhost:4443/webhookweb/303', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    //   'AUTHORIZATION': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        event:'RECEIVED_MESSAGE',
                        message: newMessage,
                        user_provider: state.nombre,
                        datoAdicional: state.mail,
                        conversationId: state.conversationId,
                    })
                })
                .then(res => res.json())
                .then(res => {
                    if(state.conversationId !== res?.conversationId){
                        state.conversationId = res?.conversationId
                        localStorage.setItem('ipChatState',JSON.stringify(state))
                        if(Boolean(state.conversationId)){
                            console.log("Escuchando: ====== "+ state.conversationId +" ======");
                            socket.on('c' + state.conversationId, handleReceivedMessage)
                        }
                    }
                })

                // clean out old message
                userInput.html('');
                // focus on input
                userInput.focus();
                
            }

            function addMessage(message, emitter) {
                var messagesContainer = $('.messages');
                messagesContainer.append([
                    `<li class="${emitter}">`,
                        message,
                    '</li>'
                ].join(''));

                messagesContainer.finish().animate({
                    scrollTop: messagesContainer.prop("scrollHeight")
                }, 250);
            }

            function validateEmail(email) {
                const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
                return emailPattern.test(email);
            }

            function onMetaAndEnter(event) {
                if ((event.metaKey || event.ctrlKey) && event.keyCode == 13) {
                    sendNewMessage();
                }
            }

            function handleSubmit(event) {
                event.preventDefault(); // Prevent the form from submitting the traditional way
                const form = document.getElementById('myForm');
                const formData = new FormData(form);

                state.nombre = formData.get('name');
                state.mail = formData.get('email');
                state.logged = true;
                localStorage.setItem('ipChatState',JSON.stringify(state))
                addMessage('¿En que podemos alludarte?', 'other')

                setTimeout(function() {
                    textBox.focus()
                }, 0);
                
                footer.style.display = 'flex';
                form.style.display = 'none'; // Hide the form
            }

        }
    }
    
    request.open("GET", url)
    request.send()
}