interface Version {
    number: number;
    message: string;
    minorEdit: boolean;
    authorId: string;
    createdAt: string;
}

interface AtlasDocFormat {
    value: string; // The JSON string representation of the document content
    representation: string;
}

interface Body {
    atlas_doc_format: AtlasDocFormat;
}

interface Links {
    editui: string;
    webui: string;
    tinyui: string;
    base: string;
}

interface PageData {
    parentType: string;
    createdAt: string;
    authorId: string;
    id: string;
    version: Version;
    title: string;
    status: string;
    spaceId: string;
    body: Body;
    parentId: string;
    ownerId: string;
    lastOwnerId: string | null;
    position: number;
    _links: Links;
}

type BodyContent = {
    type: string;
    content: ElContent[];
    attrs?: {
        layout?:string,
        width?:string,
        widthType?:string,
        level?: number,   
    }
    text?: string;
    marks?: { type: string; attrs?: {annotationType: string, id: string} }[];
};

type ElContent = {
    type: string;
    attrs?: {
        width: string,
        alt?: string,
        id: string,
        collection: string,
        type: string,
        height: string,
    },
    text?: string,
    marks?: {
        type: string,
        attrs : {
            annotationType: string,
            id: string,
            href: string,
        }
    }[],
};

type subElement = {
    tag: "p" | "h3" | "a" | "img" | "string",
    text: string,
    link?: string,
    src?: "" | Promise<string>,
}


export type parsedElement = {
    tag: "p" | "h3" | "img",
    text: subElement[],
    key: number,
}




export async function GETATTACHMENT (pageId: string, imgName: string) {

    const getAttachmentRedirect = async () => {

        const token = "ATATT3xFfGF0JxPDE6wXsDcqSUjsJFq4Y5LCFz5Dk97One3HJrma0oWo2LekklL34V1SLyeST7zFOnzFmCrB0JV4H08vL39XkHplVEicbpjD1-qdYueoIMemVW2dQPq74JLfN9L1kZj62PKWYYsogJwYxLIYfFopCOvxoa7Q56uQ2g0C2E7Wv2s=3CD95435";
        const email = `apiatetsky@trlm.com`;
    
        try {
    
            const initialUrl = `https://trillium.atlassian.net/wiki/download/attachments/${pageId}/${encodeURIComponent(imgName)}?api=v2`;
    
            const initialResponse = await fetch(initialUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
                    'Accept': 'application/json',
                },
                cache: 'no-store'
            });
    
            if (initialResponse.status === 302) {
    
                const redirectUrl = initialResponse.headers.get('Location');
                
                if (redirectUrl) {
    
                    const redirectResponse = await fetch(redirectUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
                            'Accept': 'application/json',
                            // "Access-Control-Allow-Origin": "*",
                        },
                        // mode: "no-cors",
                    });
    
                    if (redirectResponse.ok) {
                        
                        // Create a blob URL for the image and set it to the state
                        const blob = await redirectResponse.blob();
                        const imageUrl = URL.createObjectURL(blob);
                        return imageUrl;
    
                    } else {
                        throw new Error(`Failed to fetch the image: ${redirectResponse.statusText}`);
                    }
                } else {
                    // console.error("Redirect url is missing")
                    throw new Error('Redirect URL is missing.');
                }
            } 
            else if (initialResponse.status === 200) {
                const imageUrl = initialResponse.url;
    
                return imageUrl;
            }
            else {
                console.error(initialResponse);
                throw new Error(`Initial request failed: ${initialResponse.statusText}`);
            }
        } 
        catch (err) {
            console.error(err);
        }
    };

    const urlPromise = await getAttachmentRedirect()

    if (urlPromise) {
        return urlPromise;
    } 
    else {
        return ""
    }
}


export async function GETBLOG (id: string) {

    const token = "ATATT3xFfGF0JxPDE6wXsDcqSUjsJFq4Y5LCFz5Dk97One3HJrma0oWo2LekklL34V1SLyeST7zFOnzFmCrB0JV4H08vL39XkHplVEicbpjD1-qdYueoIMemVW2dQPq74JLfN9L1kZj62PKWYYsogJwYxLIYfFopCOvxoa7Q56uQ2g0C2E7Wv2s=3CD95435";
    const email = `apiatetsky@trlm.com`;

    const url = `https://trillium.atlassian.net/wiki/api/v2/pages/${id}?body-format=atlas_doc_format`;

    const parseResponse = async (response : PageData) => {

        const content = JSON.parse(response.body.atlas_doc_format.value).content[0].content;

        let parsedContentBody : parsedElement[]= [];

        const bodyContent : BodyContent[] = content[0].content

        bodyContent.forEach(async (el: BodyContent, index) => {

            const type = el.type

            // heading so must be bold
            if (type === "heading") {
                parsedContentBody.push({
                    tag: "h3",
                    text: [{
                        tag: "string",
                        text: el.content[0].text as string
                    }],
                    key: index,
                })

            } 
            // paragraph so must conglomerate the text
            else if (type === "paragraph") {
                let p_string : subElement[] = []

                el.content.forEach((element: ElContent)  => {

                    // link needs to be incorperated
                    if (element.marks && element.marks[0].type === 'link') {
                        const base = `https://kb.trilliumtrading.com/space`

                        const wordQ = element.marks[0].attrs.href.split("/") // [ "", "wiki", "spaces", "SHL", "pages", "1820164097" ]

                        const wordUrl = `${base}/${wordQ[3]}/${wordQ[5]}`

                        p_string.push({tag: "a", text: element.text as string, link: wordUrl})

                    }
                    // no special link
                    else {
                        p_string.push({tag: "string", text: element.text as string})
                    }                 
                });
                parsedContentBody.push({
                    tag: "p",
                    text: p_string,
                    key: index,
                })
            }
            // media
            else if (type === "mediaSingle" && el.content[0].attrs) {

                let name = el.content[0].attrs.alt;

                const imageUrl = name ? GETATTACHMENT(id, name) : "" ;

                parsedContentBody.push({
                    tag: "img",
                    text: [{
                        tag: "img",
                        text: name as string,
                        src: imageUrl,
                    }],
                    key: index,
                })
            }

            else {
                console.log("last remaining types", type)
            }

        });

        return parsedContentBody;
    }

    try {

        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });
        
        if (!response) {
            console.error('Could not fetch the actual query promise, response was', response);
            return [];
        }

        const data : PageData = await response.json();

        const parsedData = await parseResponse(data);

        return parsedData;
    }
    catch(error) {
        console.error("the following error occured:", error);

        return [];
    }





}


export async function GETCHILDREN (id: string) {

    const token = "ATATT3xFfGF0JxPDE6wXsDcqSUjsJFq4Y5LCFz5Dk97One3HJrma0oWo2LekklL34V1SLyeST7zFOnzFmCrB0JV4H08vL39XkHplVEicbpjD1-qdYueoIMemVW2dQPq74JLfN9L1kZj62PKWYYsogJwYxLIYfFopCOvxoa7Q56uQ2g0C2E7Wv2s=3CD95435";
    const email = `apiatetsky@trlm.com`;

    const url = `https://trillium.atlassian.net/wiki/api/v2/pages/${id}/children`


    const id_to_space = {
        // source: https://community.atlassian.com/t5/Confluence-questions/How-to-get-Confluence-Space-ID-from-Space-Key/qaq-p/630444
        "1810006112" : "SHL",
        "1907556418" : "FAQ", 
        "1769799826" : "TIG",
        "1531379753" : "INSTALL",
        "1481637970" : "TROUB",
        "1764294754" : "TIPS",
        "1531772960" : "RN",
        "1539145737" : "KB",
    } as const

    type SpaceId = keyof typeof id_to_space;

    type ResponseFormat = 
    {
        results: [
          {
            id: string,
            status: "current",
            title: string,
            spaceId: SpaceId,
            childPosition: number
          }
        ],
        _links: {
          next: string,
          base: string,
        }
      }

    type parsedResponse = {
        title: string,
        url: string,
    }[];

    const parseResponse = (response : ResponseFormat): parsedResponse => {

        const data = response.results;

        let parsed : parsedResponse = []

        data.forEach(child => {
            parsed.push({
                title: child.title,
                url: `https://kb.trilliumtrading.com/space/${id_to_space[child.spaceId]}/${child.id}/SHEL`
            })
        })

        return parsed
    }


    try {

        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
                'Accept': 'application/json'
            },
            mode: "no-cors",
            cache: 'no-store'
        });
        
        if (!response) {
            console.error('Could not fetch the actual query promise, response was', response);
            return [];
        }

        const data : ResponseFormat = await response.json();

        return parseResponse(data);
    
    }
    catch(error) {
        console.error("the following error occured: tip - this page probably does not exist (based on the input id)", error) 

        return [];
    }
}