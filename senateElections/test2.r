print(Sys.Date())
library(ggplot2)

help(package = "ggplot2")

mySum <- 3 + 4
print(mySum)

mydf <- data.frame("Cat" = c("A", "B", "C"), Values = c(12, 10, 15))

my_graph <- ggplot(data = mydf, aes(x = Cat, y = Values)) +
    geom_bar(stat = "identity", color = "#000000", fill = "blue") +
    ggtitle("My Test Bar Graph")
