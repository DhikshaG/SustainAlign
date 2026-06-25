terraform {
  required_version = ">= 1.9"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.49"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_ssh_key" "deploy" {
  name       = "sustainalign-deploy"
  public_key = var.ssh_public_key
}

resource "digitalocean_droplet" "app" {
  name     = "sustainalign-${var.environment}"
  size     = var.droplet_size
  image    = "ubuntu-24-04-x64"
  region   = var.region
  ssh_keys = [digitalocean_ssh_key.deploy.id]

  connection {
    type        = "ssh"
    user        = "root"
    host        = self.ipv4_address
    private_key = var.ssh_private_key
  }

  provisioner "remote-exec" {
    inline = [
      "apt-get update",
      "apt-get install -y python3",
    ]
  }

  tags = ["sustainalign", var.environment]

  lifecycle {
    create_before_destroy = true
  }
}

resource "digitalocean_firewall" "web" {
  name = "sustainalign-${var.environment}-web"

  droplet_ids = [digitalocean_droplet.app.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.allowed_ssh_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
