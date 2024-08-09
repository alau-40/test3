import { GETCHILDREN, GETBLOG } from "./api";


async function fetchPageChildren (id: string) {
    const nestedPosts = await GETCHILDREN(id);
    return nestedPosts;
}

const Blog = async ({ params } : {params: { slug: string}} ) => {

    // const nestedPosts = await GETCHILDREN(params.slug);
    const content = await GETBLOG(params.slug)

    return (
        <>
    
        <h1>Blog number {params.slug}</h1>

        <div className="flex flex-wrap pr-5 pl-5">
            <div className="w-1/5">

                <ul className="list-none  ">
                    {(await fetchPageChildren(params.slug)).map(post => (
                    <li key={post.url}>
                        <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={post.url}>{post.title}</a>
                    </li>
                    ))}
                </ul>
            </div>

            <div className="w-4/5 place-content-center">
                <div className="w-4/6">

                    
                    {content.map(async (element) => // parsed results - have typescript types describing what exactly it is
                        <section key={element.key}>
                            {element.tag === "p" ? 
                                <p>{element.text.map(el => (

                                    el.tag === "a" ? <a key={el.text} href={el.link} className="font-medium text-blue-600 dark:text-blue-500 hover:underline"> {el.text} </a> : el.text
                                    
                                ))}</p>
                            :
                                // if not a p tag can be either "h3" or img
                                element.tag === "h3" ? <h3 className="text-3xl font-bold dark:text-white"> {element.text[0].text} </h3> : 

                                // must be an img tag - one of the things is a promise that still must be resolved
                                <img src={(await element.text[0].src)} alt={element.text[0].text} loading="lazy"/>
                            }
                        </section>
                    )}
                </div>
            </div>
        </div>
    </>
    )

    
}


export default Blog;