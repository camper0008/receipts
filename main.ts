import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { send } from "@oak/oak";
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";

export type Config = {
    port: number;
    hostname: string;
};

async function configFromFile(path: string): Promise<Config | null> {
    try {
        return JSON.parse(await Deno.readTextFile(path));
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        return null;
    }
}

type Item = {
    date: string;
    price: number;
    name: string;
};

type Category = {
    items: Item[];
    title: string;
    color: string;
};

async function listen({ port, hostname }: Config) {
    const routes = new Router();
    const categories: Category[] = await Deno.readTextFile("categories.json")
        .then((x) => JSON.parse(x));

    routes.get("/api/categories", (ctx) => {
        ctx.response.body = categories;
    });

    routes.post("/api/log", async (ctx) => {
        const body = await ctx.request.body.json();
        const idx = parseInt(body.category);
        const name = body.name;
        const price = body.price;
        const category: Category = categories[idx];
        category.items.push({
            name,
            price,
            date: (new Date()).toISOString(),
        });
        await Deno.writeTextFile("categories.json", JSON.stringify(categories));
        ctx.response.body = { ok: true };
    });

    routes.get("/:path+", async (ctx) => {
        console.log(ctx.request.url.pathname);
        await send(ctx, ctx.request.url.pathname || "", {
            root: `${Deno.cwd()}/web`,
        });
    });

    const app = new Application();
    app.use(oakCors());
    app.use(routes.routes());
    app.use(routes.allowedMethods());

    app.addEventListener("listen", ({ port, hostname }) => {
        console.log(`listening on ${hostname},`, port);
    });

    await app.listen({ port, hostname });
}

if (import.meta.main) {
    const configPath = "conf.json";
    const config = await configFromFile(configPath);
    if (!config) {
        console.error(`error: could not find config at '${configPath}'`);
        Deno.exit(1);
    }
    await listen(config);
}
