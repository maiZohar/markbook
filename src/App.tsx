import React, {useEffect, useState} from 'react';
import './App.css';

export const App = () => {
    const [url, setUrl] = useState<string>('');
    let nameBox = (document.getElementById('linkName') as HTMLInputElement);
    let urlBox = (document.getElementById('urlBox') as HTMLInputElement);
    let keywordsBox = (document.getElementById('keywords') as HTMLInputElement);
    let commentBox = (document.getElementById('comment') as HTMLInputElement);
    let saveLinkPage = (document.getElementById('save-link-page') as HTMLInputElement);
    let listContainer = (document.getElementById('listContainer') as HTMLInputElement);
    let userLinksPage = (document.getElementById('user-links-page') as HTMLInputElement);

    const userId = 1;
    const db = process.env["DB"];

    /**
     * Get current URL
     */
    useEffect(() => {
        const queryInfo = {active: true, lastFocusedWindow: true};

        chrome.tabs && chrome.tabs.query(queryInfo, tabs => {
            const url = tabs[0].url || '';
            setUrl(url);
        });
    }, []);


    /**
     * Save link
     */
    const saveLink = () => {

        if (db === 'local-storage') {
            // local storage
            chrome.storage.sync.get("links", ({links}) => {
                let keywords = keywordsBox.value.split(",");
                links[urlBox.value] = {"name": nameBox.value, "keywords": keywords, "comment": commentBox.value};
                chrome.storage.sync.set({links});
                console.log(JSON.stringify(links));
            });
        } else {
            // redis
            const fetchData = async () => {
                let data = new URLSearchParams({"name": nameBox.value, "keywords": keywordsBox.value, "comment": commentBox.value, "link": urlBox.value});
                await fetch(`http://localhost:8000/saveLink/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: data,
                });
            };
            fetchData();
        }
        ChangeToLinksView();
    };

    /**
     * Remove link
     */
    const removeLink = () => {
        if (db === 'local-storage') {
            // local storage
            chrome.storage.sync.get("links", ({links}) => {
                delete links[urlBox.value];
                chrome.storage.sync.set({links});
                console.log(JSON.stringify(links));
            });
        } else {
            // redis
            const fetchData = async () => {
            let data = new URLSearchParams({"url": urlBox.value});
                await fetch(`http://localhost:8000/removeLink/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
            body: data,
                });
            };
            fetchData();
        }
        ChangeToLinksView();
    };

    /**
     * Change to links view
     */
    const ChangeToLinksView = () => {
        updateListContainer();
        userLinksPage.style.display = '';
        saveLinkPage.style.display = 'none';
    };

    /**
     * change to save link view
     */
    const ChangeToSaveLinkView = () => {
        userLinksPage.style.display = 'none';
        saveLinkPage.style.display = '';
    };


    const updateListContainer = () => {
        if (db === 'local-storage') {
            // local storage
            listContainer.innerHTML = '';
            chrome.storage.sync.get("links", ({links}) => {
                let linksNames = Object.keys(links);
                for (let i = 0; i < linksNames.length; i++) {
                    addLinkToList(listContainer, linksNames[i], links[linksNames[i]].name, links[linksNames[i]].comment)
                }
            });
        } else {
            // redis
            const fetchData = async () => {
                const result = await fetch(`http://localhost:8000/getAllLinks/${userId}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                });
                const body = await result.json();
                const links = body.links;
                let linksNames = Object.keys(links);
                for (let i = 0; i < linksNames.length; i++) {
                    let linkContent = JSON.parse(links[linksNames[i]]);
                    addLinkToList(listContainer, linksNames[i], linkContent.name, linkContent.comment)
                }
            };
            fetchData();
        }
    };

    const addLinkToList = (listContainer: HTMLInputElement, linkHref: string, name: string, comment: string) => {
        let link = document.createElement('li');
        link.className = "list-group-item d-flex justify-content-between lh-condensed";
        let linkName = document.createElement('h6');
        linkName.className = "my-0";
        let a = document.createElement('a');
        a.target = '_blank';
        a.href = linkHref;
        a.innerText = name;
        linkName.appendChild(a);
        let description = document.createElement('small');
        description.className = "text-muted";
        description.innerText = displayComment(comment);
        let container = document.createElement('div');
        container.appendChild(linkName);
        container.appendChild(description);
        link.appendChild(container);
        link.appendChild(document.createElement('br'));
        listContainer.appendChild(link);
    }

    /**
     * Display comment logic
     */
    const displayComment = (comment: string) => {
        if (comment?.length > 100) {
            return comment.substr(0, 100) + '...';
        }
        return comment || '';
    };

    return (
        <div className="App">
            <header className="App-header">
                <div id="save-link-page">
                    <div>
                        <label htmlFor="linkName">Link:</label>
                        <input type="text" id="urlBox" value={url}/>
                    </div>
                    <div>
                        <label htmlFor="linkName">Name:</label>
                        <input type="text" id="linkName"/>
                    </div>
                    <div>
                        <label htmlFor="keywords">Keywords:</label>
                        <input type="text" id="keywords"/>
                    </div>
                    <div>
                        <label htmlFor="comment">Comment:</label>
                        <input type="text" id="comment"/>
                    </div>
                    <button onClick={saveLink}>Save</button>
                    <button onClick={removeLink}>Remove</button>
                    <button onClick={ChangeToLinksView}>Your links</button>
                </div>
                <div id="user-links-page" style={{"display": "none"}}>
                    <ul id="listContainer">
                    </ul>
                    <button onClick={ChangeToSaveLinkView}>Back</button>
                </div>
            </header>
        </div>
    );
};

export default App;
