function logAddItemDialog(category, categories) {
    document.querySelector("#log-item-dialog").showModal();
    const idx = categories.findIndex((x) => x.title === category.title);
    document.querySelector(`#log-item-category-${idx}`).click();
}

function prepLogItemDialog(categories) {
    const radioGroup = document.querySelector("category-radio-group");
    const rendered = categories.map((category, idx) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "category";
        input.id = `log-item-category-${idx}`;
        input.value = idx;
        label.htmlFor = input.id;
        label.style.backgroundColor = category.color;
        label.append(input, category.title);
        return label;
    });
    radioGroup.replaceChildren(...rendered);

    const form = document.querySelector("#log-item-form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        await fetch("/api/log", {
            method: "POST",
            body: JSON.stringify({
                name: data.get("name"),
                category: parseInt(data.get("category")),
                price: parseFloat(data.get("price")),
            }),
        });
        await rerender();
        document.querySelector("#log-item-dialog").close();
        form.reset();
    });
}

function calculateTotal(category) {
    const now = new Date();
    return category.items
        .filter((x) =>
            now.getFullYear() === x.date.getFullYear() &&
            now.getMonth() === x.date.getMonth()
        )
        .map((x) => x.price)
        .reduce((a, b) => a + b, 0);
}

function renderCategory(category, categories) {
    const root = document.createElement("usage-category");
    root.addEventListener("click", () => {
        logAddItemDialog(category, categories);
    });
    const highestPrice = Math.max(0, ...categories.map(calculateTotal));
    const totalPrice = calculateTotal(category);
    const bar = document.createElement("category-bar");
    const percentage = document.createElement("category-bar-percentage");
    const fill = highestPrice !== 0 ? totalPrice / highestPrice : 0.1;
    percentage.style.height = `${100 * fill}%`;
    percentage.style.backgroundColor = category.color;
    bar.append(percentage);
    const amount = document.createElement("category-amount");
    const bold = document.createElement("b");
    bold.textContent = totalPrice;
    amount.append(bold, " kr");
    const title = document.createElement("category-title");
    title.textContent = category.title;
    root.append(title, bar, amount);

    return root;
}

async function fetchCategories() {
    const categories = await fetch("/api/categories").then((x) => x.json());
    return categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({
            ...item,
            date: new Date(item.date),
        })),
    }));
}

async function rerender() {
    const categories = await fetchCategories();
    const rendered = categories
        .map((category) => renderCategory(category, categories));

    const chart = document.querySelector("usage-chart");
    chart.replaceChildren(...rendered);
}

async function main() {
    const categories = await fetchCategories();

    prepLogItemDialog(categories);

    await rerender();
}

main();
